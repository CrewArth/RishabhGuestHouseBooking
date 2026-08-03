/**
 * Migration: Remove duplicated guest fields from Booking documents.
 *
 * For each booking that has flat guest fields but no userId, creates/updates
 * the User record via upsertNormalUser, sets userId on the booking, then
 * strips the flat fields.
 *
 * Run ONCE before deploying the schema change:
 *   node backend/scripts/migrateBookingToUserId.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

import { upsertNormalUser } from '../utils/upsertNormalUser.js';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌  MONGO_URI not found'); process.exit(1); }

await mongoose.connect(MONGO_URI);
console.log('✅  Connected to MongoDB');

const db = mongoose.connection.db;
const col = db.collection('bookings');

const FLAT_FIELDS = [
  'fullName', 'email', 'phone', 'address',
  'dateOfBirth', 'gender', 'nationality',
  'identityType', 'identityNumber',
  'emergencyContactName', 'emergencyContactPhone',
];

// Find bookings that still have flat guest fields
const bookings = await col.find({
  $or: FLAT_FIELDS.map((f) => ({ [f]: { $exists: true } })),
}).toArray();

console.log(`📋  Found ${bookings.length} bookings to migrate`);

let updated = 0, skipped = 0;

for (const b of bookings) {
  try {
    // If booking already has a userId, just strip flat fields
    let userId = b.userId;

    if (!userId && (b.email || b.phone)) {
      try {
        const user = await upsertNormalUser({
          fullName:             b.fullName,
          email:                b.email,
          phone:                b.phone,
          address:              b.address,
          dateOfBirth:          b.dateOfBirth,
          gender:               b.gender,
          nationality:          b.nationality,
          identityType:         b.identityType,
          identityNumber:       b.identityNumber,
          emergencyContactName: b.emergencyContactName,
          emergencyContactPhone:b.emergencyContactPhone,
          bookingId:            b._id,
        });
        userId = user._id;
      } catch (upsertErr) {
        // Duplicate key — find the existing user by email or phone
        const normalizedEmail = b.email?.trim().toLowerCase() || null;
        const normalizedPhone = b.phone ? String(b.phone).trim() : null;
        const conditions = [];
        if (normalizedEmail) conditions.push({ email: normalizedEmail });
        if (normalizedPhone) conditions.push({ phone: normalizedPhone });
        // Also try stripping/adding +91 prefix for Indian numbers
        if (normalizedPhone) {
          const stripped = normalizedPhone.replace(/^\+91/, '');
          const prefixed = normalizedPhone.startsWith('+') ? normalizedPhone : `+91${normalizedPhone}`;
          conditions.push({ phone: stripped }, { phone: prefixed });
        }
        const { default: User } = await import('../models/User.js');
        const existing = conditions.length > 0
          ? await User.findOne({ role: 'USER', $or: conditions }).lean()
          : null;
        if (existing) {
          userId = existing._id;
          console.log(`🔗  Linked booking ${b._id} to existing user ${existing.email || existing.phone}`);
        } else {
          console.warn(`⚠️   Could not resolve user for booking ${b._id}: ${upsertErr.message}`);
          skipped++;
          continue;
        }
      }
    }

    const unsetFields = {};
    FLAT_FIELDS.forEach((f) => { unsetFields[f] = ''; });

    await col.updateOne(
      { _id: b._id },
      {
        ...(userId ? { $set: { userId } } : {}),
        $unset: unsetFields,
      }
    );
    updated++;
  } catch (err) {
    console.error(`⚠️  Failed booking ${b._id}:`, err.message);
    skipped++;
  }
}

console.log(`\n✅  Migration complete — Updated: ${updated}, Skipped: ${skipped}`);
await mongoose.disconnect();
process.exit(0);
