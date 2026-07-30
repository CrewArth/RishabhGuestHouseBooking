// utils/upsertNormalUser.js
import User from "../models/User.js";

/**
 * Upsert a guest into the User collection with role = "USER".
 *
 * Lookup priority:
 *   1. Match by email  (if provided)
 *   2. Match by phone  (if provided)
 *   3. Create new record if neither matches
 *
 * On every call the booking ID is appended and the profile
 * fields are refreshed with the latest data from the booking.
 *
 * @param {Object}   params
 * @param {string}   params.fullName
 * @param {string}   [params.email]
 * @param {string}   [params.phone]
 * @param {string}   [params.address]
 * @param {Date}     [params.dateOfBirth]
 * @param {string}   [params.gender]
 * @param {string}   [params.nationality]
 * @param {string}   [params.identityType]
 * @param {string}   [params.identityNumber]
 * @param {string}   [params.emergencyContactName]
 * @param {string}   [params.emergencyContactPhone]
 * @param {ObjectId} params.bookingId
 *
 * @returns {Promise<User>} The upserted document
 */
export const upsertNormalUser = async ({
  fullName,
  email,
  phone,
  address,
  dateOfBirth,
  gender,
  nationality,
  identityType,
  identityNumber,
  emergencyContactName,
  emergencyContactPhone,
  bookingId,
}) => {
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const normalizedPhone = phone ? String(phone).trim() : null;

  // Build lookup: match only USER role records by email OR phone
  const lookupConditions = [];
  if (normalizedEmail) lookupConditions.push({ email: normalizedEmail });
  if (normalizedPhone) lookupConditions.push({ phone: normalizedPhone });

  let existingUser = null;

  if (lookupConditions.length > 0) {
    existingUser = await User.findOne({
      role: "USER",
      $or: lookupConditions,
    });
  }

  // Split fullName into firstName / lastName
  const nameParts  = (fullName || "").trim().split(/\s+/);
  const firstName  = nameParts[0] || "Guest";
  const lastName   = nameParts.slice(1).join(" ") || "";

  // Only set a field if the incoming value is non-empty (don't blank out existing data)
  const profileUpdate = {
    firstName,
    lastName,
    ...(normalizedEmail               && { email:                normalizedEmail }),
    ...(normalizedPhone               && { phone:                normalizedPhone }),
    ...(address?.trim()               && { address:              address.trim() }),
    ...(dateOfBirth                   && { dateOfBirth }),
    ...(gender                        && { gender }),
    ...(nationality?.trim()           && { nationality:          nationality.trim() }),
    ...(identityType                  && { identityType }),
    ...(identityNumber?.trim()        && { identityNumber:       identityNumber.trim() }),
    ...(emergencyContactName?.trim()  && { emergencyContactName: emergencyContactName.trim() }),
    ...(emergencyContactPhone?.trim() && { emergencyContactPhone: emergencyContactPhone.trim() }),
    lastBookingAt: new Date(),
  };

  if (existingUser) {
    existingUser.set(profileUpdate);
    if (bookingId && !existingUser.bookingIds.map(String).includes(String(bookingId))) {
      existingUser.bookingIds.push(bookingId);
    }
    existingUser.totalBookings = existingUser.bookingIds.length;
    await existingUser.save();
    console.log(`👤 NormalUser updated: ${existingUser.email || existingUser.phone}`);
    return existingUser;
  }

  // New guest — no password needed
  const newUser = await User.create({
    ...profileUpdate,
    role:          "USER",
    password:      null,
    bookingIds:    bookingId ? [bookingId] : [],
    totalBookings: bookingId ? 1 : 0,
  });

  console.log(`👤 NormalUser created: ${newUser.email || newUser.phone}`);
  return newUser;
};
