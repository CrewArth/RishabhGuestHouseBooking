// utils/emailTemplates/bookingStatusUpdate.js
import { baseTemplate } from "./baseTemplate.js";

export const bookingStatusUpdate = (user, booking, guestHouse, status) => {
  const isApproved = status === "approved";
  const statusColor = isApproved ? "#10b981" : "#ef4444";
  const statusBg = isApproved ? "#d1fae5" : "#fee2e2";
  const statusIcon = isApproved ? "✅" : "❌";
  const message = isApproved
    ? "Great news! Your booking request has been approved. We're excited to host you!"
    : "We're sorry to inform you that your booking request could not be approved at this time.";

  return baseTemplate(
    `Booking ${status === "approved" ? "Approved" : "Status Update"}`,
    `
    <p style="margin: 0 0 16px 0; color: #2a2a2a;">Hi <strong style="color: #0B1957;">${user.firstName}</strong>,</p>
    
    <div style="
      background: ${statusBg};
      padding: 20px;
      border-radius: 12px;
      margin: 0 0 24px 0;
      border-left: 4px solid ${statusColor};
    ">
      <p style="margin: 0; color: ${statusColor}; font-weight: 700; font-size: 18px;">
        ${statusIcon} ${message}
      </p>
    </div>

    <div style="
      background: linear-gradient(135deg, #F8F3EA 0%, #f5efe0 100%);
      padding: 24px;
      border-radius: 12px;
      margin: 24px 0;
      border-left: 4px solid #0B1957;
    ">
      <h3 style="
        color: #0B1957; 
        margin: 0 0 16px 0; 
        font-size: 18px;
        font-weight: 700;
      ">Booking Information</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; width: 140px; vertical-align: top;">Guest House:</td>
          <td style="padding: 10px 0; color: #2a2a2a; font-weight: 500;">${guestHouse.guestHouseName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; vertical-align: top;">Check-in:</td>
          <td style="padding: 10px 0; color: #2a2a2a;">${new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; vertical-align: top;">Check-out:</td>
          <td style="padding: 10px 0; color: #2a2a2a;">${new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; vertical-align: top;">Status:</td>
          <td style="padding: 10px 0;">
            <span style="
              color: ${statusColor}; 
              font-weight: 700; 
              text-transform: uppercase;
              font-size: 14px;
            ">${status}</span>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 24px 0 16px 0; color: #2a2a2a;">
      If you have any questions or concerns, feel free to contact us anytime. We're here to help!
    </p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #F8F3EA;">
      <p style="margin: 0 0 8px 0; color: #2a2a2a;">
        <strong style="color: #0B1957;">Best regards,</strong>
      </p>
      <p style="margin: 0; color: #4a4a4a; font-size: 15px;">
        <strong>The Rishabh Guest House Team</strong>
      </p>
    </div>
    `
  );
};
