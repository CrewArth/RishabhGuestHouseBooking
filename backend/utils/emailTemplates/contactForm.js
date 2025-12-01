// utils/emailTemplates/contactForm.js
import { baseTemplate } from "./baseTemplate.js";

export const contactFormEmail = (contactData) =>
  baseTemplate(
    "📧 New Contact Form Submission",
    `
    <p style="margin: 0 0 16px 0; color: #2a2a2a;">Hi Admin,</p>
    
    <p style="margin: 0 0 24px 0; color: #2a2a2a;">
      A new contact form submission has been received from the website and requires your attention.
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
      ">Contact Information</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; width: 140px; vertical-align: top;">Name:</td>
          <td style="padding: 10px 0; color: #2a2a2a; font-weight: 500;">${contactData.firstName} ${contactData.lastName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; vertical-align: top;">Email:</td>
          <td style="padding: 10px 0; color: #2a2a2a;">
            <a href="mailto:${contactData.email}" style="color: #0B1957; text-decoration: none; font-weight: 500;">${contactData.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; vertical-align: top;">Phone:</td>
          <td style="padding: 10px 0; color: #2a2a2a;">
            <a href="tel:${contactData.countryCode}${contactData.phone}" style="color: #0B1957; text-decoration: none; font-weight: 500;">
              ${contactData.countryCode} ${contactData.phone}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; vertical-align: top;">Message:</td>
          <td style="padding: 10px 0; color: #2a2a2a; line-height: 1.6;">${contactData.message}</td>
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
      <p style="margin: 0; color: #0B1957; font-size: 14px;">
        <strong>📅 Submitted:</strong> ${new Date().toLocaleString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </p>
    </div>

    <div style="
      background-color: #fff4e6;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      border-left: 4px solid #f59e0b;
    ">
      <p style="margin: 0; color: #2a2a2a; font-size: 14px; line-height: 1.6;">
        <strong style="color: #0B1957;">Action Required:</strong> Please review this inquiry and respond to the user at 
        <a href="mailto:${contactData.email}" style="color: #0B1957; text-decoration: none; font-weight: 600;">${contactData.email}</a> 
        or call them at ${contactData.countryCode} ${contactData.phone}.
      </p>
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #F8F3EA;">
      <p style="margin: 0; color: #4a4a4a; font-size: 13px; line-height: 1.6;">
        This is an automated notification from the Rishabh Guest House contact form system.
      </p>
    </div>
    `
  );
