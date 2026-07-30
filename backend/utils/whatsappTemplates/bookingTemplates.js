// utils/whatsappTemplates/bookingTemplates.js

/**
 * Format a date to a readable string (DD Mon YYYY)
 */
const fmtDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/**
 * Sent to guest when a booking request is submitted (pending review)
 */
export const wpBookingRequested = ({ fullName, guestHouseName, checkIn, checkOut, bookingId }) =>
  `🏨 *Rishabh Guest House*\n\nHi ${fullName},\n\nYour booking request has been received!\n\n📋 *Booking Details*\n• Guest House: ${guestHouseName}\n• Check-in:  ${fmtDate(checkIn)}\n• Check-out: ${fmtDate(checkOut)}\n• Ref ID: ${String(bookingId).slice(-8).toUpperCase()}\n\nWe'll notify you once it's reviewed. Thank you! 🙏`;

/**
 * Sent to guest when their booking is approved
 */
export const wpBookingApproved = ({ fullName, guestHouseName, checkIn, checkOut, bookingId }) =>
  `✅ *Booking Confirmed!*\n\nHi ${fullName},\n\nGreat news — your booking has been *approved*.\n\n📋 *Booking Details*\n• Guest House: ${guestHouseName}\n• Check-in:  ${fmtDate(checkIn)}\n• Check-out: ${fmtDate(checkOut)}\n• Ref ID: ${String(bookingId).slice(-8).toUpperCase()}\n\nWe look forward to hosting you. Safe travels! 🏨`;

/**
 * Sent to guest when their booking is rejected
 */
export const wpBookingRejected = ({ fullName, guestHouseName, checkIn, checkOut, bookingId }) =>
  `❌ *Booking Update*\n\nHi ${fullName},\n\nUnfortunately your booking request has been *rejected*.\n\n📋 *Booking Details*\n• Guest House: ${guestHouseName}\n• Check-in:  ${fmtDate(checkIn)}\n• Check-out: ${fmtDate(checkOut)}\n• Ref ID: ${String(bookingId).slice(-8).toUpperCase()}\n\nPlease contact us for further assistance.`;

/**
 * Sent to guest when their booking is cancelled
 */
export const wpBookingCancelled = ({ fullName, guestHouseName, checkIn, checkOut, bookingId }) =>
  `🚫 *Booking Cancelled*\n\nHi ${fullName},\n\nYour booking has been *cancelled*.\n\n📋 *Booking Details*\n• Guest House: ${guestHouseName}\n• Check-in:  ${fmtDate(checkIn)}\n• Check-out: ${fmtDate(checkOut)}\n• Ref ID: ${String(bookingId).slice(-8).toUpperCase()}\n\nContact us if you have any questions.`;
