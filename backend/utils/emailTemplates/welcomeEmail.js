// utils/emailTemplates/welcomeEmail.js
import { baseTemplate } from "./baseTemplate.js";

export const welcomeEmail = (user) =>
  baseTemplate(
    "Welcome to Rishabh Guest House!",
    `
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p>Thank you for joining <b>Rishabh Guest House</b>!</p>
    <p>If you ever need assistance, feel free to contact our support team.</p>
    <br/>
    <p>Warm regards,<br/><b>The Rishabh Guest House Team</b></p>
    `
  );
