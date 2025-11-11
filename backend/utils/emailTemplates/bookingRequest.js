// utils/emailTemplates/bookingRequest.js
import { baseTemplate } from "./baseTemplate.js";

export const bookingRequest = (user, booking, guestHouse) =>
  baseTemplate(
    "Your Booking Request Has Been Received",
    `
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p>We’ve received your booking request successfully.</p>

    <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:10px 0;">
      <p><b>Guest House:</b> ${guestHouse.guestHouseName}</p>
      <p><b>Check-in:</b> ${new Date(booking.checkIn).toLocaleDateString()}</p>
      <p><b>Check-out:</b> ${new Date(booking.checkOut).toLocaleDateString()}</p>
    </div>

    <p>Our admin team will review your request shortly. You’ll receive an update once it’s approved or rejected.</p>
    `
  );
