// utils/emailTemplates/baseTemplate.js
export const baseTemplate = (title, content) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Outfit:wght@700&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0; padding:0; background-color:#F8F3EA;">
    <div style="
      font-family: 'Inter', 'Noto Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #F8F3EA;
      padding: 40px 20px;
      color: #1a1a1a;
      line-height: 1.6;
    ">
      <div style="
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(11, 25, 87, 0.1);
        overflow: hidden;
        border: 1px solid rgba(11, 25, 87, 0.1);
      ">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #0B1957 0%, #1a2d7a 100%);
          color: #F8F3EA;
          text-align: center;
          padding: 32px 24px;
          font-size: 24px;
          font-weight: 700;
          font-family: 'Outfit', 'Inter', 'Roboto', sans-serif;
          letter-spacing: 0.5px;
        ">
          Rishabh Guest House
        </div>

        <!-- Content -->
        <div style="padding: 32px 28px; font-size: 16px; background-color: #ffffff;">
          <h2 style="
            color: #0B1957; 
            font-size: 24px; 
            font-weight: 700;
            margin: 0 0 24px 0;
            font-family: 'Inter', 'Roboto', sans-serif;
            line-height: 1.3;
          ">${title}</h2>
          ${content}
        </div>
      </div>
    </div>
  </body>
  </html>
`;
