// models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    guestHouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuestHouse",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    fullName: { type: String },
    phone: { type: String },
    address: { type: String },
    specialRequests: { type: String },

  },
  { timestamps: true }
);

// Indexes for performance optimization
// Compound index for overlap checking query (bedId + status + date range)
bookingSchema.index({ bedId: 1, status: 1, checkIn: 1, checkOut: 1 });
// Index for user bookings lookup
bookingSchema.index({ userId: 1, createdAt: -1 });
// Index for guest house bookings
bookingSchema.index({ guestHouseId: 1, createdAt: -1 });

export default mongoose.model("Booking", bookingSchema);
