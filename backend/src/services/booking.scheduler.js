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

            const liveEvents = await Event.find({
                salesOpenAt: { $lte: now },
                eventDate: { $gt: now },
                status: { $in: ["upcoming", "live"] },
            }).select("_id");

            if (!liveEvents.length) return;

            const bookings = await Booking.find({
                event: { $in: liveEvents.map((event) => event._id) },
                status: "pending",
            })
                .sort({ createdAt: 1 })
                .limit(50)
                .select("_id");

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