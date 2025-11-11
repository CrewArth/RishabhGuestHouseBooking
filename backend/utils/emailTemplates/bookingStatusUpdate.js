// utils/emailTemplates/bookingStatusUpdate.js
import { baseTemplate } from "./baseTemplate.js";

export const bookingStatusUpdate = (user, booking, guestHouse, status) => {
  const color = status === "approved" ? "#28a745" : "#dc3545";
  const message =
    status === "approved"
      ? "Good news! Your booking has been approved 🎉"
      : "We’re sorry to inform you that your booking was rejected.";

  return baseTemplate(
    "Your Booking Status Has Been Updated",
    `
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p style="color:${color}; font-weight:bold;">${message}</p>

    <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:10px 0;">
      <p><b>Guest House:</b> ${guestHouse.guestHouseName}</p>
      <p><b>Check-in:</b> ${new Date(booking.checkIn).toLocaleDateString()}</p>
      <p><b>Check-out:</b> ${new Date(booking.checkOut).toLocaleDateString()}</p>
      <p><b>Status:</b> <span style="color:${color};">${status.toUpperCase()}</span></p>
    </div>

    <p>If you have questions, feel free to contact us anytime.</p>
    <p>Warm regards,<br/><b>The Rishabh Guest House Team</b></p>
    `
  );
};
