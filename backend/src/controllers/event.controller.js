import Event from "../models/event.model.js";
import Seat from "../models/seat.model.js";

// Create event
export const createEvent = async (req, res) => {
    try {
        const { name, venue, eventDate, salesOpenAt, salesCloseAt } = req.body;

        if (!name || !venue || !eventDate || !salesOpenAt || !salesCloseAt) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const eventDateTime = new Date(eventDate);
        const salesOpenTime = new Date(salesOpenAt);
        const salesCloseTime = new Date(salesCloseAt);

        if (
            isNaN(eventDateTime.getTime()) ||
            isNaN(salesOpenTime.getTime()) ||
            isNaN(salesCloseTime.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format"
            });
        }

        if (salesOpenTime >= salesCloseTime) {
            return res.status(400).json({
                success: false,
                message: "Sales opening time must be before sales closing time"
            });
        }

        if (salesCloseTime >= eventDateTime) {
            return res.status(400).json({
                success: false,
                message: "Sales closing time must be before the event date"
            });
        }

        const event = await Event.create({
            name,
            venue,
            eventDate: eventDateTime,
            salesOpenAt: salesOpenTime,
            salesCloseAt: salesCloseTime
        });

        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: event
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get all events
export const getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get single event
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: event
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Generate seats for an event
export const generateSeats = async (req, res) => {
    try {
        const { seats } = req.body;
        const { eventId } = req.params;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        if (!Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one seat"
            });
        }

        const seatData = seats.map((seat) => ({
            ...seat,
            event: eventId
        }));

        const createdSeats = await Seat.insertMany(seatData);

        return res.status(201).json({
            success: true,
            message: "Seats generated successfully",
            count: createdSeats.length,
            data: createdSeats
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};