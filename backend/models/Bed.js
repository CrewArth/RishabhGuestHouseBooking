import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
    roomId: {type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true},
    bedNumber: {type: Number, required: true},
    isAvailable: {type: Boolean, default: true}
}, {timestamps: true});

export default mongoose.model("Bed", bedSchema);