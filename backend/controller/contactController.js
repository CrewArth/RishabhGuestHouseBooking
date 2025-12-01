// controller/contactController.js
import { sendEmail } from '../utils/emailService.js';
import { contactFormEmail } from '../utils/emailTemplates/contactForm.js';
import { contactFormConfirmation } from '../utils/emailTemplates/contactFormConfirmation.js';
import User from '../models/User.js';

// Handle contact form submission
export const submitContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, countryCode, phone, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !message) {
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Please provide a valid email address" 
      });
    }

    // Validate phone number (at least 6 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 6) {
      return res.status(400).json({ 
        message: "Phone number must be at least 6 digits" 
      });
    }

    // Validate message length
    if (message.length > 120) {
      return res.status(400).json({ 
        message: "Message must be 120 characters or less" 
      });
    }

    // Prepare contact data
    const contactData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      countryCode: countryCode || '+62',
      phone: phone.trim(),
      message: message.trim()
    };

    // Send response immediately
    res.status(200).json({ 
      message: "Thank you for contacting us! We will get back to you soon." 
    });

    // Fire-and-forget: Send confirmation email to client
    sendEmail({
      to: contactData.email,
      subject: "✅ We Received Your Contact Form Submission - Rishabh Guest House",
      html: contactFormConfirmation(contactData),
    }).then(() => {
      console.log(`✅ Contact form confirmation email sent to ${contactData.email}`);
    }).catch(err => {
      console.error(`❌ Failed to send confirmation email to ${contactData.email}:`, err);
    });

    // Fire-and-forget: Get all admin emails and send notification
    User.find({ role: 'admin', isActive: true })
      .select('email')
      .then(admins => {
        if (admins.length === 0) {
          console.log('⚠️  No active admin users found to send contact form notification');
          return;
        }

        // Send email to all admins
        const emailPromises = admins.map(admin => 
          sendEmail({
            to: admin.email,
            subject: `📧 New Contact Form Submission from ${contactData.firstName} ${contactData.lastName}`,
            html: contactFormEmail(contactData),
          }).catch(err => {
            console.error(`❌ Failed to send contact form email to ${admin.email}:`, err);
          })
        );

        return Promise.all(emailPromises);
      })
      .then(() => {
        console.log(`✅ Contact form notification sent to all admins`);
      })
      .catch(err => {
        console.error('❌ Error fetching admin users:', err);
      });

  } catch (error) {
    console.error("Error processing contact form:", error);
    res.status(500).json({ 
      message: "Server error processing your request. Please try again later." 
    });
  }
};

