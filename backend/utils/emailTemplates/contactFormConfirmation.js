// utils/emailTemplates/contactFormConfirmation.js
import { baseTemplate } from "./baseTemplate.js";

export const contactFormConfirmation = (contactData) =>
  baseTemplate(
    "Thank You for Contacting Us!",
    `
    <p style="margin: 0 0 16px 0; color: #2a2a2a;">Hi <strong style="color: #0B1957;">${contactData.firstName} ${contactData.lastName}</strong>,</p>
    
    <p style="margin: 0 0 24px 0; color: #2a2a2a;">
      Thank you for reaching out to <strong style="color: #0B1957;">Rishabh Guest House</strong>! We have successfully received your contact form submission.
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
      ">Your Submission Details</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; width: 140px; vertical-align: top;">Email:</td>
          <td style="padding: 10px 0; color: #2a2a2a;">${contactData.email}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #0B1957; vertical-align: top;">Phone:</td>
          <td style="padding: 10px 0; color: #2a2a2a;">${contactData.countryCode} ${contactData.phone}</td>
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
      <p style="margin: 0; color: #0B1957; font-size: 15px; line-height: 1.6;">
        <strong>What's Next?</strong><br/>
        Our team has received your inquiry and will review it shortly. We'll get back to you as soon as possible.   
      </p>
    </div>

    <p style="margin: 24px 0 16px 0; color: #2a2a2a;">
      If you have any urgent questions or concerns, please feel free to contact us directly at:
    </p>
    
    <div style="
      background: linear-gradient(135deg, #F8F3EA 0%, #f5efe0 100%);
      padding: 20px;
      border-radius: 12px;
      margin: 16px 0 24px 0;
    ">
      <ul style="margin: 0; padding-left: 20px; color: #2a2a2a;">
        <li style="margin-bottom: 12px;">
          <strong style="color: #0B1957;">Email:</strong> 
          <a href="mailto:sales@rishabhsoft.com" style="color: #0B1957; text-decoration: none; font-weight: 500;">sales@rishabhsoft.com</a>
        </li>
        <li style="margin-bottom: 0;">
          <strong style="color: #0B1957;">Phone:</strong> 
          <a href="tel:+919913414224" style="color: #0B1957; text-decoration: none; font-weight: 500;">+91 9913414224</a>
        </li>
      </ul>
    </div>

    <p style="margin: 24px 0 16px 0; color: #2a2a2a;">
      We appreciate your interest in Rishabh Guest House and look forward to assisting you!
    </p>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #F8F3EA;">
      <p style="margin: 0 0 8px 0; color: #2a2a2a;">
        <strong style="color: #0B1957;">Best regards,</strong>
      </p>
      <p style="margin: 0; color: #4a4a4a; font-size: 15px;">
        <strong>The Rishabh Guest House Team</strong>
      </p>
      <p style="margin: 12px 0 0 0; color: #6c757d; font-size: 12px;">
        This is an automated confirmation email. Please do not reply to this message.
      </p>
    </div>
    `
  );
