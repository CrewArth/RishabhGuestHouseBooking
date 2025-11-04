import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    guestHouseId: { type: mongoose.Schema.Types.ObjectId, ref: "GuestHouse", required: true },
    roomNumber: { type: Number },
    roomType: { type: String, enum: ["single", "double", "family"], required: true },
    isAvailable: { type: Boolean, default: true },
    roomCapacity: {type: Number, required: true}
}, { timestamps: true })

export default mongoose.model("Room", roomSchema);