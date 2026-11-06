import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        customerEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        customerName: {
            type: String,
            required: true,
            trim: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        preferredSection: {
            type: String,
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        maxPrice: {
            type: Number,
            required: true,
            min: 0
        },

        bookedSeats: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seat"
        }],

        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "confirmed",
                "failed",
                "cancelled"
            ],
            default: "pending"
        },

        failureReason: {
            type: String,
            default: null
        },

        bookingAttemptedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;