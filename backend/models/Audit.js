import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    action: {
        type: String,
        enum: ["approved", "cancelled"],
    },
    entityType:{
        type: String,
        enum: ["Booking", "Room", "GuestHouse", "User"]
    }
}, {timestamps: true})

export default mongoose.model("Audit", auditSchema);