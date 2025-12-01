// utils/emailTemplates/adminBookingAlert.js
import { baseTemplate } from "./baseTemplate.js";

export const adminBookingAlert = (adminEmail, user, booking, guestHouse) =>
  baseTemplate(
    "🆕 New Booking Request Received",
    `
    <p style="margin: 0 0 16px 0; color: #2a2a2a;">Hi Admin,</p>
    
    <p style="margin: 0 0 24px 0; color: #2a2a2a;">
      A new booking request has been submitted and requires your review.
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
        margin: 0 0 20px 0; 
        font-size: 18px;
        font-weight: 700;
      ">Booking Request Details</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; width: 140px; vertical-align: top;">Guest House:</td>
          <td style="padding: 10px 0; color: #2a2a2a; font-weight: 500;">${guestHouse.guestHouseName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; vertical-align: top;">Guest Name:</td>
          <td style="padding: 10px 0; color: #2a2a2a; font-weight: 500;">${user.firstName} ${user.lastName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; vertical-align: top;">Email:</td>
          <td style="padding: 10px 0; color: #2a2a2a;">
            <a href="mailto:${user.email}" style="color: #0B1957; text-decoration: none; font-weight: 500;">${user.email}</a>
          </td>
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
              background-color: #fef3c7;
              color: #92400e;
              padding: 4px 12px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
            ">Pending Review</span>
          </td>
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
        <strong>📋 Action Required:</strong> Please log in to your admin panel to review and approve or reject this booking request.
      </p>
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #F8F3EA;">
      <p style="margin: 0; color: #4a4a4a; font-size: 13px; line-height: 1.6;">
        This is an automated notification from the Rishabh Guest House booking system.
      </p>
    </div>
    `
  );
