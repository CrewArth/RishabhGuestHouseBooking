import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({

    guestHouseId: { type: String, ref: "GuestHouse", required: true },

    roomNumber: { type: Number },
    
    roomType: { type: String, enum: ["single", "double", "family"], required: true },
    
    isAvailable: { type: Boolean, default: true },
    
    roomCapacity: {type: Number, required: true},

    price: { type: Number, required: false },

    discountPercentage: { type: Number, required: false, default: 0, min: 0, max: 100 },

    // Soft delete / active flag (needed by controllers & queries)
    isActive: { type: Boolean, default: true },

}, { timestamps: true });

// Uniqueness: a room number must be unique within a guest house
roomSchema.index({ guestHouseId: 1, roomNumber: 1 }, { unique: true });

export default mongoose.model("Room", roomSchema);