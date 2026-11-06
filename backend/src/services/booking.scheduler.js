import cron from "node-cron";
import Event from "../models/event.model.js";
import Booking from "../models/booking.model.js";
import { processBooking } from "./booking.service.js";

let isRunning = false;

export const startBookingScheduler = () => {
    cron.schedule("*/10 * * * * *", async () => {
        if (isRunning) return;

        isRunning = true;

        try {
            const now = new Date();

            // 1. Find events whose sales have closed
            const closedEvents = await Event.find({
                salesCloseAt: { $lte: now },
                status: { $in: ["upcoming", "live"] },
            }).select("_id");

            // 2. Fail any pending bookings for closed events
            if (closedEvents.length) {
                const result = await Booking.updateMany(
                    {
                        event: { $in: closedEvents.map((event) => event._id) },
                        status: "pending",
                    },
                    {
                        $set: {
                            status: "failed",
                            failureReason: "Ticket sales have closed.",
                        },
                    }
                );

                if (result.modifiedCount > 0) {
                    console.log(
                        `${result.modifiedCount} pending bookings failed because sales closed.`
                    );
                }
            }

            // 3. Find events currently accepting bookings
            const liveEvents = await Event.find({
                salesOpenAt: { $lte: now },
                salesCloseAt: { $gt: now },
                eventDate: { $gt: now },
                status: { $in: ["upcoming", "live"] },
            }).select("_id");

            if (!liveEvents.length) return;

            // 4. Fetch pending bookings in FIFO order
            const bookings = await Booking.find({
                event: { $in: liveEvents.map((event) => event._id) },
                status: "pending",
            })
                .sort({ createdAt: 1 })
                .limit(50)
                .select("_id");

            // 5. Process each booking
            for (const booking of bookings) {
                try {
                    const result = await processBooking(booking._id);
                    console.log("Booking result:", result);
                } catch (error) {
                    console.error(
                        `Booking ${booking._id} failed:`,
                        error.message
                    );
                }
            }
        } catch (error) {
            console.error("Booking scheduler error:", error);
        } finally {
            isRunning = false;
        }
    });

    console.log("Booking scheduler started.");
};