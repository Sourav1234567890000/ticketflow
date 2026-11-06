import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        seatNumber: {
            type: String,
            required: true
        },

        section: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ["available", "booked"],
            default: "available"
        },
        booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    },
    { timestamps: true }
);

// A seat number must be unique within an event.
seatSchema.index(
    { event: 1, seatNumber: 1 },
    { unique: true }
);

const Seat = mongoose.model("Seat", seatSchema);

export default Seat;