// routes/bookingRoutes.js
import express from "express";
import {
  createBooking,
  getAllBookings,
  getMyBookings,
  approveBooking,
  rejectBooking,
  checkAvailability,
  getApprovedBookingsForCalendar
} from "../controller/bookingController.js";

const router = express.Router();

// User creates a booking
router.post("/", createBooking);

// User gets their bookings
router.get("/my", getMyBookings);

// Admin fetches all bookings
router.get("/", getAllBookings);

// Admin approves / rejects booking
router.patch("/:id/approve", approveBooking);
router.patch("/:id/reject", rejectBooking);

// To Check Room or Bed Availibility
router.get("/availability", checkAvailability);

// Get approved bookings for calendar (admin)
router.get("/calendar", getApprovedBookingsForCalendar);


export default router;
