/**
 * Migration: Convert Booking.guestHouseId from String ("GH001") to ObjectId
 *
 * Run ONCE before deploying the schema change:
 *   node backend/scripts/migrateGuestHouseId.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI not found in .env');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log('✅  Connected to MongoDB');

const db = mongoose.connection.db;
const bookingsCol    = db.collection('bookings');
const guestHousesCol = db.collection('guesthouses');

// Build a map: guestHouseId string → ObjectId _id
const guestHouses = await guestHousesCol.find({}).toArray();
const ghMap = {};
for (const gh of guestHouses) {
  ghMap[gh.guestHouseId] = gh._id; // e.g.  "GH001" → ObjectId(...)
}

console.log(`🏠  Found ${guestHouses.length} guest houses`);

// Find all bookings that still have a string guestHouseId
const bookings = await bookingsCol.find({ guestHouseId: { $type: 'string' } }).toArray();
console.log(`📋  Found ${bookings.length} bookings with string guestHouseId`);

let updated = 0;
let skipped = 0;

for (const booking of bookings) {
  const objectId = ghMap[booking.guestHouseId];
  if (!objectId) {
    console.warn(`⚠️   No GuestHouse found for guestHouseId="${booking.guestHouseId}" (booking ${booking._id}) — skipping`);
    skipped++;
    continue;
  }

  await bookingsCol.updateOne(
    { _id: booking._id },
    { $set: { guestHouseId: objectId } }
  );
  updated++;
}

console.log(`\n✅  Migration complete`);
console.log(`   Updated : ${updated}`);
console.log(`   Skipped : ${skipped}`);

await mongoose.disconnect();
process.exit(0);
