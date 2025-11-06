import mongoose from 'mongoose';
import { AutoIncrementID } from '@typegoose/auto-increment';

const guestHouseSchema = new mongoose.Schema({
  guestHouseId: { type: Number, unique: true },
  guestHouseName: { type: String, required: true, unique: true },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true }
  },
  image: { type: String },
  description: { type: String },
  maintenance: { type: Boolean, default: false }
}, { timestamps: true });

// Add auto-increment plugin to the schema
guestHouseSchema.plugin(AutoIncrementID, {
  field: 'guestHouseId',
  startAt: 1,
  incrementBy: 1,
  trackerCollection: 'counters', // collection name for the counters
  prefix: 'GH',
  formatter: (number) => `${number.toString().padStart(4, '0')}`
});

export default mongoose.model("GuestHouse", guestHouseSchema);