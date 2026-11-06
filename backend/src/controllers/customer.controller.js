import Event from "../models/event.model.js";
import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";

// Get available seats for an event
export const getAvailableSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const seats = await Seat.find({
      event: eventId,
      status: "available",
    }).sort({ seatNumber: 1 });

    return res.status(200).json({
      success: true,
      count: seats.length,
      data: seats,
    });
  } catch (error) {
    console.error("Get available seats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available seats",
    });
  }
};

// Create booking preference
export const createBookingRequest = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      eventId,
      preferredSection,
      quantity,
      maxPrice,
    } = req.body;

    if (
      !customerName ||
      !customerEmail ||
      !eventId ||
      !preferredSection ||
      !quantity ||
      maxPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!Number.isInteger(Number(quantity)) || quantity < 1 || quantity > 10) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 10",
      });
    }

    if (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid maximum price",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const now = new Date();

    if (
      !["upcoming", "live"].includes(event.status) ||
      !event.salesCloseAt ||
      now >= new Date(event.salesCloseAt) ||
      now >= new Date(event.eventDate)
    ) {
      console.log("Booking request rejected:", {
        eventName: event.name,
        currentTime: now.toISOString(),
        salesCloseAt: event.salesCloseAt,
        reason: "Booking preferences are no longer accepted",
      });

      return res.status(400).json({
        success: false,
        message: "Booking preferences can no longer be created for this event",
      });
    }

    const booking = await Booking.create({
      customerName,
      customerEmail: customerEmail.toLowerCase().trim(),
      event: eventId,
      preferredSection,
      quantity: Number(quantity),
      maxPrice: Number(maxPrice),
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Booking preferences saved successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Create booking request error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking request",
    });
  }
};

// Get customer bookings
export const getMyBookings = async (req, res) => {
  try {
    const { customerEmail } = req.params;

    const bookings = await Booking.find({
      customerEmail: customerEmail.toLowerCase().trim(),
    })
      .populate("event")
      .populate("bookedSeats");

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// Update booking preferences
export const updateBookingRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { customerEmail, preferredSection, quantity, maxPrice } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      customerEmail: customerEmail?.toLowerCase().trim(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending booking requests can be updated",
      });
    }

    if (preferredSection !== undefined) {
      booking.preferredSection = preferredSection;
    }

    if (quantity !== undefined) {
      if (!Number.isInteger(Number(quantity)) || quantity < 1 || quantity > 10) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be between 1 and 10",
        });
      }

      booking.quantity = Number(quantity);
    }

    if (maxPrice !== undefined) {
      if (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid maximum price",
        });
      }

      booking.maxPrice = Number(maxPrice);
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking preferences updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Update booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update booking",
    });
  }
};