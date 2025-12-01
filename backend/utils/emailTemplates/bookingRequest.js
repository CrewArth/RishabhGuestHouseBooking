// utils/emailTemplates/bookingRequest.js
import { baseTemplate } from "./baseTemplate.js";

export const bookingRequest = (user, booking, guestHouse) =>
  baseTemplate(
    "Your Booking Request Has Been Received",
    `
    <p style="margin: 0 0 16px 0; color: #2a2a2a;">Hi <strong style="color: #0B1957;">${user.firstName}</strong>,</p>
    
    <p style="margin: 0 0 24px 0; color: #2a2a2a;">
      We've successfully received your booking request. Our team is currently reviewing your submission and will get back to you shortly.
    </p>

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
      ">Booking Details</h3>
      
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
      </table>
    </div>

    <div style="
      background-color: #e8f0fe;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      border: 1px solid rgba(11, 25, 87, 0.1);
    ">
      <p style="margin: 0; color: #0B1957; font-size: 14px; line-height: 1.6;">
        <strong>📋 Next Steps:</strong> Our admin team will review your request and you'll receive an email notification once your booking has been approved or rejected. This typically takes 24-48 hours.
      </p>
    </div>

    <p style="margin: 24px 0 16px 0; color: #2a2a2a;">
      If you have any questions or need to make changes to your booking, please don't hesitate to contact our support team.
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
