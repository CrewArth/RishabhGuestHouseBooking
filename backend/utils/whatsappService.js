// utils/whatsappService.js
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

/**
 * Format a phone number into a WhatsApp-compatible E.164 string.
 * Handles numbers stored as plain digits (e.g. 9876543210) or strings.
 * Defaults to +91 (India) if no country code is detected.
 */
const toWhatsAppNumber = (phone) => {
  if (!phone) return null;
  let num = String(phone).replace(/\D/g, ""); // strip non-digits
  if (num.length === 10) num = `91${num}`;    // prepend India country code
  return `whatsapp:+${num}`;
};

/**
 * Format a date to readable string e.g. "24 Jul 2026"
 */
export const fmtDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/**
 * Send a WhatsApp message using a Twilio Content Template.
 *
 * Template: room_booked (en) — HX8aee299fcc2306ab9b12ff9c9f786a5b
 *   {{1}} Guest House name
 *   {{2}} Check-out date
 *   {{3}} Check-in date
 *   {{4}} Room number
 *
 * @param {Object} options
 * @param {string|number} options.to            - Recipient phone (raw digits or E.164)
 * @param {string}        options.guestHouseName
 * @param {Date|string}   options.checkIn
 * @param {Date|string}   options.checkOut
 * @param {string}        options.roomNumber
 */
export const sendBookingWhatsApp = async ({ to, guestHouseName, checkIn, checkOut, roomNumber }) => {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("⚠️  Twilio credentials not configured. WhatsApp message skipped.");
    return;
  }

  const toNumber = toWhatsAppNumber(to);
  if (!toNumber) {
    console.warn("⚠️  Invalid phone number for WhatsApp notification. Skipping.");
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      contentSid: process.env.TWILIO_TEMPLATE_ROOM_BOOKED,
      contentVariables: JSON.stringify({
        "1": guestHouseName || "Guest House",
        "2": fmtDate(checkOut),
        "3": fmtDate(checkIn),
        "4": roomNumber || "N/A",
      }),
    });
    console.log(`📱 WhatsApp sent to ${toNumber} | SID: ${message.sid}`);
  } catch (error) {
    console.error("❌ WhatsApp send error:", error.message || error);
  }
};

/**
 * Send a WhatsApp cancellation message using the cancelled_room template.
 *
 * Template: cancelled_room (en) — HX1a5609c1cfec5f5ce1e91b3e44b27093
 *   {{1}} Room number
 *   {{2}} Guest House name
 *
 * @param {Object} options
 * @param {string|number} options.to            - Recipient phone (raw digits or E.164)
 * @param {string}        options.roomNumber
 * @param {string}        options.guestHouseName
 */
export const sendCancelWhatsApp = async ({ to, roomNumber, guestHouseName }) => {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("⚠️  Twilio credentials not configured. WhatsApp message skipped.");
    return;
  }

  const toNumber = toWhatsAppNumber(to);
  if (!toNumber) {
    console.warn("⚠️  Invalid phone number for WhatsApp notification. Skipping.");
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      contentSid: process.env.TWILIO_TEMPLATE_ROOM_CANCELLED,
      contentVariables: JSON.stringify({
        "1": roomNumber || "N/A",
        "2": guestHouseName || "Guest House",
      }),
    });
    console.log(`📱 WhatsApp cancellation sent to ${toNumber} | SID: ${message.sid}`);
  } catch (error) {
    console.error("❌ WhatsApp cancel send error:", error.message || error);
  }
};
