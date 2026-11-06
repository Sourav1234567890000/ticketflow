import express from "express";

import {
  getAvailableSeats,
  createBookingRequest,
  getMyBookings,
  updateBookingRequest,
} from "../controllers/customer.controller.js";

const router = express.Router();

router.get("/events/:eventId/seats", getAvailableSeats);

router.post("/bookings", createBookingRequest);

router.get("/bookings/:customerEmail", getMyBookings);

router.patch("/bookings/:bookingId", updateBookingRequest);

export default router;