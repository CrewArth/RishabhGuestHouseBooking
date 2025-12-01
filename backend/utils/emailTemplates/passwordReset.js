// utils/emailTemplates/passwordReset.js
import { baseTemplate } from "./baseTemplate.js";

export const passwordResetEmail = (user, resetLink) =>
  baseTemplate(
    "Reset Your Password",
    `
    <p style="margin: 0 0 16px 0; color: #2a2a2a;">Hi <strong style="color: #0B1957;">${user.firstName}</strong>,</p>
    
    <p style="margin: 0 0 24px 0; color: #2a2a2a;">
      We received a request to reset the password for your Rishabh Guest House account. If you made this request, please click the button below to reset your password.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}"
         style="
           display: inline-block;
           padding: 16px 32px;
           background: linear-gradient(135deg, #0B1957 0%, #1a2d7a 100%);
           color: #F8F3EA;
           border-radius: 8px;
           text-decoration: none;
           font-weight: 600;
           font-size: 16px;
           box-shadow: 0 4px 12px rgba(11, 25, 87, 0.3);
           transition: all 0.3s;
         ">
        Reset Password
      </a>
    </div>

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
