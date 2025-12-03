// utils/emailTemplates/adminCreatedUser.js
import { baseTemplate } from "./baseTemplate.js";

export const adminCreatedUserEmail = (user, password) =>
  baseTemplate(
    "Your Rishabh Guest House Account Credentials",
    `
    <p style="margin: 0 0 16px 0; color: #2a2a2a;">Hi <strong style="color: #0B1957;">${user.firstName}</strong>,</p>
    
    <p style="margin: 0 0 20px 0; color: #2a2a2a;">
      Your account has been created for <strong style="color: #0B1957;">Rishabh Guest House</strong>. Below are your login credentials:
    </p>

    <div style="
      background: linear-gradient(135deg, #F8F3EA 0%, #f5efe0 100%);
      padding: 24px;
      border-radius: 12px;
      margin: 24px 0;
      border-left: 4px solid #0B1957;
    ">
      <p style="margin: 0 0 16px 0; color: #0B1957; font-weight: 600; font-size: 15px;">
        Your Login Credentials:
      </p>
      <div style="background: #ffffff; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
        <p style="margin: 0 0 8px 0; color: #2a2a2a; font-size: 14px;">
          <strong style="color: #0B1957;">Email:</strong> ${user.email}
        </p>
        <p style="margin: 0; color: #2a2a2a; font-size: 14px;">
          <strong style="color: #0B1957;">Password:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 13px;">${password}</code>
        </p>
      </div>
      <p style="margin: 12px 0 0 0; color: #dc2626; font-size: 13px; font-weight: 600;">
        ⚠️ Please keep these credentials secure and change your password after first login.
      </p>
    </div>
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

