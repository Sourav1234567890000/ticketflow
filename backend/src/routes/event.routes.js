import express from "express";

import {
    createEvent,
    getEvents,
    getEventById,
    generateSeats
} from "../controllers/event.controller.js";

const router = express.Router();

router.post("/", createEvent);

router.get("/", getEvents);

router.get("/:eventId", getEventById);

router.post("/:eventId/seats", generateSeats);

export default router;