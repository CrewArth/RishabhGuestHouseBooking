import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

const db = mongoose.connection.db;
const bad = await db.collection('bookings').find({ guestHouseId: { $type: 'string' } }).toArray();
console.log('Bookings with string guestHouseId:', bad.map(b => ({ _id: b._id, guestHouseId: b.guestHouseId })));

// Delete orphan bookings whose guestHouseId doesn't match any guest house
for (const b of bad) {
  const gh = await db.collection('guesthouses').findOne({ guestHouseId: b.guestHouseId });
  if (!gh) {
    console.log(`No guest house found for "${b.guestHouseId}" — deleting booking ${b._id}`);
    await db.collection('bookings').deleteOne({ _id: b._id });
  } else {
    console.log(`Fixing booking ${b._id} → ${gh._id}`);
    await db.collection('bookings').updateOne({ _id: b._id }, { $set: { guestHouseId: gh._id } });
  }
}

console.log('Done');
await mongoose.disconnect();
process.exit(0);
