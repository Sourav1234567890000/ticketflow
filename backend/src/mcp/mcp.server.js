import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import Event from "../models/event.model.js";
import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";

const text = (obj) => ({
  content: [{ type: "text", text: JSON.stringify(obj, null, 2) }],
});

const fail = (msg) => ({
  isError: true,
  content: [{ type: "text", text: msg }],
});

const isValidId = (id) => /^[a-f\d]{24}$/i.test(id);

const normalizeEmail = (email) => email.trim().toLowerCase();

// Built fresh for every request (stateless).
export function buildMcpServer() {
  const server = new McpServer({
    name: "ticketflow",
    version: "0.1.0",
  });

  // 1. LIST EVENTS
  server.registerTool(
    "list_events",
    {
      title: "List events",
      description:
        "List all upcoming and live events. Returns event IDs, venue, event date and ticket sales opening time.",
      inputSchema: {},
    },
    async () => {
      try {
        const events = await Event.find({
          status: { $ne: "cancelled" },
        })
          .sort({ eventDate: 1 })
          .lean();

        return text(
          events.map((event) => ({
            eventId: String(event._id),
            name: event.name,
            venue: event.venue,
            eventDate: event.eventDate,
            salesOpenAt: event.salesOpenAt,
            status: event.status,
          }))
        );
      } catch (error) {
        console.error("MCP list_events error:", error);
        return fail("Unable to fetch events.");
      }
    }
  );

  // 2. LIST AVAILABLE SEATS
  server.registerTool(
    "list_available_seats",
    {
      title: "List available seats",
      description:
        "Show available seats grouped by section and price. Use list_events first to get the eventId.",
      inputSchema: {
        eventId: z.string().describe("Event ID from list_events"),
      },
    },
    async ({ eventId }) => {
      try {
        if (!isValidId(eventId)) {
          return fail("Invalid eventId.");
        }

        const event = await Event.findById(eventId).lean();

        if (!event) {
          return fail("Event not found.");
        }

        const seats = await Seat.find({
          event: eventId,
          status: "available",
        })
          .sort({ section: 1, price: 1, seatNumber: 1 })
          .lean();

        const sections = {};

        for (const seat of seats) {
          const key = `${seat.section}|${seat.price}`;

          sections[key] ??= {
            section: seat.section,
            price: seat.price,
            availableCount: 0,
            sampleSeats: [],
          };

          sections[key].availableCount++;

          if (sections[key].sampleSeats.length < 10) {
            sections[key].sampleSeats.push(seat.seatNumber);
          }
        }

        return text({
          event: event.name,
          status: event.status,
          salesOpenAt: event.salesOpenAt,
          totalAvailable: seats.length,
          sections: Object.values(sections),
        });
      } catch (error) {
        console.error("MCP list_available_seats error:", error);
        return fail("Unable to fetch available seats.");
      }
    }
  );

  // 3. CREATE BOOKING REQUEST
  server.registerTool(
    "create_booking_request",
    {
      title: "Create booking request",
      description:
        "Save a customer's ticket preferences before ticket sales open. " +
        "This creates a booking request, NOT an actual ticket. " +
        "The backend scheduler will attempt the booking when sales open.",
      inputSchema: {
        customerName: z.string().min(2).describe("Customer's name"),
        customerEmail: z.string().email().describe("Customer's email"),
        eventId: z.string().describe("Event ID from list_events"),
        preferredSection: z.string().min(1).describe("Preferred seating section"),
        quantity: z.number().int().min(1).max(10),
        maxPrice: z.number().min(0).describe("Maximum price per seat"),
      },
    },
    async ({
      customerName,
      customerEmail,
      eventId,
      preferredSection,
      quantity,
      maxPrice,
    }) => {
      try {
        if (!isValidId(eventId)) {
          return fail("Invalid eventId.");
        }

        const event = await Event.findById(eventId);

        if (!event) {
          return fail("Event not found.");
        }

        if (event.status !== "upcoming" || event.salesOpenAt <= new Date()) {
          return fail("Booking requests are only accepted before ticket sales open.");
        }

        const booking = await Booking.create({
          customerName: customerName.trim(),
          customerEmail: normalizeEmail(customerEmail),
          event: eventId,
          preferredSection,
          quantity,
          maxPrice,
          status: "pending",
        });

        return text({
          message: "Booking request created successfully.",
          bookingId: String(booking._id),
          event: event.name,
          preferredSection: booking.preferredSection,
          quantity: booking.quantity,
          maxPrice: booking.maxPrice,
          status: booking.status,
          salesOpenAt: event.salesOpenAt,
        });
      } catch (error) {
        console.error("MCP create_booking_request error:", error);
        return fail("Unable to create booking request.");
      }
    }
  );

  // 4. MY BOOKINGS
  server.registerTool(
    "my_bookings",
    {
      title: "My bookings",
      description:
        "Show all booking requests associated with the supplied customer email, including their current status.",
      inputSchema: {
        customerEmail: z.string().email().describe("Customer's email"),
      },
    },
    async ({ customerEmail }) => {
      try {
        const bookings = await Booking.find({
          customerEmail: normalizeEmail(customerEmail),
        })
          .populate("event", "name venue eventDate salesOpenAt")
          .populate("bookedSeats", "seatNumber section price")
          .sort({ createdAt: -1 })
          .lean();

        return text(bookings);
      } catch (error) {
        console.error("MCP my_bookings error:", error);
        return fail("Unable to fetch bookings.");
      }
    }
  );

  // 5. UPDATE BOOKING REQUEST
  server.registerTool(
    "update_booking_request",
    {
      title: "Update booking request",
      description:
        "Update a pending booking request. Confirmed, processing, failed or cancelled requests cannot be edited.",
      inputSchema: {
        bookingId: z.string().describe("Booking ID"),
        customerEmail: z.string().email().describe("Customer's email"),
        preferredSection: z.string().min(1).optional(),
        quantity: z.number().int().min(1).max(10).optional(),
        maxPrice: z.number().min(0).optional(),
      },
    },
    async ({
      bookingId,
      customerEmail,
      preferredSection,
      quantity,
      maxPrice,
    }) => {
      try {
        if (!isValidId(bookingId)) {
          return fail("Invalid bookingId.");
        }

        const updates = {};

        if (preferredSection !== undefined) {
          updates.preferredSection = preferredSection;
        }

        if (quantity !== undefined) {
          updates.quantity = quantity;
        }

        if (maxPrice !== undefined) {
          updates.maxPrice = maxPrice;
        }

        if (Object.keys(updates).length === 0) {
          return fail("Provide at least one field to update.");
        }

        const booking = await Booking.findOne({
          _id: bookingId,
          customerEmail: normalizeEmail(customerEmail),
        });

        if (!booking) {
          return fail("Booking not found.");
        }

        if (booking.status !== "pending") {
          return fail("Only pending booking requests can be updated.");
        }

        Object.assign(booking, updates);
        await booking.save();

        return text({
          message: "Booking request updated successfully.",
          bookingId: String(booking._id),
          preferredSection: booking.preferredSection,
          quantity: booking.quantity,
          maxPrice: booking.maxPrice,
          status: booking.status,
        });
      } catch (error) {
        console.error("MCP update_booking_request error:", error);
        return fail("Unable to update booking request.");
      }
    }
  );

  // 6. MY TICKETS
  server.registerTool(
    "my_tickets",
    {
      title: "My tickets",
      description:
        "Check confirmed ticket bookings and show the assigned seat numbers. Use this after the booking scheduler has run.",
      inputSchema: {
        customerEmail: z.string().email().describe("Customer's email"),
      },
    },
    async ({ customerEmail }) => {
      try {
        const bookings = await Booking.find({
          customerEmail: normalizeEmail(customerEmail),
          status: "confirmed",
        })
          .populate("event", "name venue eventDate")
          .populate("bookedSeats", "seatNumber section price")
          .lean();

        if (bookings.length === 0) {
          return text({
            message: "No confirmed tickets found.",
            tickets: [],
          });
        }

        return text({
          message: "Confirmed tickets found.",
          tickets: bookings,
        });
      } catch (error) {
        console.error("MCP my_tickets error:", error);
        return fail("Unable to fetch tickets.");
      }
    }
  );

  return server;
}