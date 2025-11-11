// utils/emailTemplates/adminBookingAlert.js
import { baseTemplate } from "./baseTemplate.js";

export const adminBookingAlert = (adminEmail, user, booking, guestHouse) =>
  baseTemplate(
    "🆕 New Booking Request Received",
    `
    <p>Hi Admin,</p>
    <p>A new booking request has been submitted.</p>

    <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:10px 0;">
      <p><b>Guest House:</b> ${guestHouse.guestHouseName}</p>
      <p><b>User:</b> ${user.firstName} ${user.lastName} (${user.email})</p>
      <p><b>Check-in:</b> ${new Date(booking.checkIn).toLocaleDateString()}</p>
      <p><b>Check-out:</b> ${new Date(booking.checkOut).toLocaleDateString()}</p>
    </div>

    <p>Login to your admin panel to approve or reject this request.</p>
    <p>— Rishabh Guest House System</p>
    `
  );
