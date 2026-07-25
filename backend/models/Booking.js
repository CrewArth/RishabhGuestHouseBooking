// models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    guestHouseId: {
      type: String,
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
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    nationality: { type: String },
    identityType: { type: String },
    identityNumber: { type: String },
    verificationImage: { type: String },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    familyMembers: [{
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      age: { type: Number, min: 0 },
      verificationImage: { type: String },
    }],
    bookingSource: {
      type: String,
      enum: ["self_service", "admin"],
      default: "self_service",
    },
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
