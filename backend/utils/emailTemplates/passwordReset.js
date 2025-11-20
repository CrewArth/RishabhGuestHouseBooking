import { baseTemplate } from "./baseTemplate.js";

export const passwordResetEmail = (user, resetLink) =>
  baseTemplate(
    "Reset Your Password",
    `
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p>We received a request to reset the password for your account.</p>

    <p style="text-align:center; margin: 30px 0;">
      <a href="${resetLink}"
         style="
           display:inline-block;
           padding: 12px 24px;
           background-color:#2563eb;
           color:#fff;
           border-radius:8px;
           text-decoration:none;
           font-weight:600;">
        Reset Password
      </a>
    </p>

    <p>This link will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
    <p>Thanks,<br/>The Rishabh Guest House Team</p>
    `
  );

