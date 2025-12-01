// utils/emailTemplates/welcomeEmail.js
import { baseTemplate } from "./baseTemplate.js";

export const welcomeEmail = (user) =>
  baseTemplate(
    "Welcome to Rishabh Guest House!",
    `
    <p style="margin: 0 0 16px 0; color: #2a2a2a;">Hi <strong style="color: #0B1957;">${user.firstName}</strong>,</p>
    
    <p style="margin: 0 0 20px 0; color: #2a2a2a;">
      Thank you for joining <strong style="color: #0B1957;">Rishabh Guest House</strong>! We're thrilled to have you as part of our community.
    </p>

    <div style="
      background: linear-gradient(135deg, #F8F3EA 0%, #f5efe0 100%);
      padding: 20px;
      border-radius: 12px;
      margin: 24px 0;
      border-left: 4px solid #0B1957;
    ">
      <p style="margin: 0 0 12px 0; color: #0B1957; font-weight: 600; font-size: 15px;">
        What you can do now:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #2a2a2a;">
        <li style="margin-bottom: 8px;">Browse and book available guest houses</li>
        <li style="margin-bottom: 8px;">Manage your bookings from your dashboard</li>
        <li style="margin-bottom: 8px;">Update your profile information</li>
        <li>Contact our support team anytime for assistance</li>
      </ul>
    </div>

    <p style="margin: 24px 0 16px 0; color: #2a2a2a;">
      If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us anytime.
    </p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #F8F3EA;">
      <p style="margin: 0 0 8px 0; color: #2a2a2a;">
        <strong style="color: #0B1957;">Warm regards,</strong>
      </p>
      <p style="margin: 0; color: #4a4a4a; font-size: 15px;">
        <strong>The Rishabh Guest House Team</strong>
      </p>
    </div>
    `
  );
