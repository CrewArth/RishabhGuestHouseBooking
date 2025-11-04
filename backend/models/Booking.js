import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true },

    guestHouseId: { type: mongoose.Schema.Types.ObjectId,
        ref: "GuestHouse",
        required: true },

    roomId: { type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true },
        
    // Bed id is remaining to enter here still...
    checkIn: { type: Date,
        required: true },

    checkOut: { type: Date,
        required: true },

    location: {
        
    },

    status: { type: String,
        enum: ["pending", "approved", "cancelled"],
        default: "pending"}},
        { timestamps: true });

export default mongoose.model("Booking", bookingSchema);