import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },

  bedNumber: {
    type: Number,
    required: true, 
  },

  bedType: {
    type: String,
    enum: ["single", "double", "suite"],
    required: true,
  },

  isAvailable: {
    type: Boolean,
    default: true,
  },

  isActive: {
    type: Boolean,
    default: true, // soft delete functionality
  },
}, { timestamps: true });

// Unique constraint: No two beds in the same room should have the same bed number
bedSchema.index({ roomId: 1, bedNumber: 1 }, { unique: true });

export default mongoose.model("Bed", bedSchema);
