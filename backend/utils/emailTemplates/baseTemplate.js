// utils/emailTemplates/baseTemplate.js
export const baseTemplate = (title, content) => `
  <div style="
    font-family: 'Segoe UI', sans-serif;
    background-color: #f4f6f8;
    padding: 30px;
    color: #333;
  ">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    ">
      <!-- Header -->
      <div style="
        background-color: #007bff;
        color: white;
        text-align: center;
        padding: 18px;
        font-size: 22px;
        font-weight: 600;
      ">
        Rishabh Guest House
      </div>

      <!-- Content -->
      <div style="padding: 25px; font-size: 15px; line-height: 1.6;">
        <h2 style="color:#007bff; font-size:20px;">${title}</h2>
        ${content}
      </div>

      <!-- Footer -->
      <div style="background-color:#f8f9fa; text-align:center; padding:15px; font-size:13px; color:#555;">
        © ${new Date().getFullYear()} Rishabh Guest House. All rights reserved.<br/>
        <a href="#" style="color:#007bff; text-decoration:none;">Visit our website</a>
      </div>
    </div>
  </div>
`;
