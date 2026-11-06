import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        venue: {
            type: String,
            required: true
        },

        eventDate: {
            type: Date,
            required: true
        },

        salesOpenAt: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["upcoming", "live", "completed", "cancelled"],
            default: "upcoming"
        }
    },
    { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;