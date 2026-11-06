import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import Event from "../models/event.model.js";
import Seat from "../models/seat.model.js";

export const processBooking = async (bookingId) => {
    const session = await mongoose.startSession();

    let result = null;

    try {
        await session.withTransaction(async () => {
            const now = new Date();

            // Claim this booking request.
            const booking = await Booking.findOneAndUpdate(
                {
                    _id: bookingId,
                    status: "pending",
                },
                {
                    $set: {
                        status: "processing",
                        bookingAttemptedAt: now,
                    },
                },
                {
                    returnDocument: "after",
                    session,
                }
            );

            // Another worker may already have processed it.
            if (!booking) {
                result = { message: "Booking is not pending." };
                return;
            }

            const event = await Event.findById(booking.event).session(session);

            if (!event) {
                booking.status = "failed";
                booking.failureReason = "Event not found.";
                await booking.save({ session });

                result = { status: "failed", reason: booking.failureReason };
                return;
            }

            // Check whether the event is cancelled or completed.
            if (event.status === "cancelled" || event.status === "completed") {
                booking.status = "failed";
                booking.failureReason = "Event is no longer available.";
                await booking.save({ session });

                result = { status: "failed", reason: booking.failureReason };
                return;
            }

            // Check whether sales opening time has arrived.
            if (now < new Date(event.salesOpenAt)) {
                booking.status = "pending";
                booking.bookingAttemptedAt = null;
                await booking.save({ session });

                result = { status: "pending", reason: "Sales have not opened." };
                return;
            }

            // Check whether sales have closed.
            if (!event.salesCloseAt || now >= new Date(event.salesCloseAt)) {
                booking.status = "failed";
                booking.failureReason = "Ticket sales have closed.";
                await booking.save({ session });

                result = { status: "failed", reason: booking.failureReason };
                return;
            }

            // Check whether the event has already started.
            if (new Date(event.eventDate) <= now) {
                booking.status = "failed";
                booking.failureReason = "Event has already started.";
                await booking.save({ session });

                result = { status: "failed", reason: booking.failureReason };
                return;
            }

            // Find seats matching the customer's preferences.
            const availableSeats = await Seat.find({
                event: booking.event,
                section: booking.preferredSection,
                price: { $lte: booking.maxPrice },
                status: "available",
            })
                .sort({ price: 1, seatNumber: 1 })
                .limit(booking.quantity)
                .session(session);

            // Do not partially book a request.
            if (availableSeats.length < booking.quantity) {
                booking.status = "failed";
                booking.failureReason = "Not enough matching seats available.";
                await booking.save({ session });

                result = { status: "failed", reason: booking.failureReason };
                return;
            }

            const seatIds = availableSeats.map((seat) => seat._id);

            // Claim all selected seats atomically.
            const seatUpdate = await Seat.updateMany(
                {
                    _id: { $in: seatIds },
                    status: "available",
                },
                {
                    $set: {
                        status: "booked",
                        booking: booking._id,
                    },
                },
                { session }
            );

            // Abort the transaction if another booking claimed any seat.
            if (seatUpdate.modifiedCount !== booking.quantity) {
                throw new Error("SEAT_ALLOCATION_CONFLICT");
            }

            // Confirm the booking only after all seats are claimed.
            booking.bookedSeats = seatIds;
            booking.status = "confirmed";
            booking.failureReason = null;

            await booking.save({ session });

            result = {
                status: "confirmed",
                bookingId: booking._id,
                bookedSeats: seatIds,
            };
        });

        return result;
    } finally {
        await session.endSession();
    }
};