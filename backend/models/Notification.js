import mongoose from 'mongoose';

const notficationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
    }

}, { timestamps: true })

export default mongoose.model("Notification", notficationSchema);   