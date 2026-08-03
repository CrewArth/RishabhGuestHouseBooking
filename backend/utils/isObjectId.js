/**
 * Returns true only for valid 24-character hex ObjectId strings.
 * mongoose.Types.ObjectId.isValid() returns true for short strings like "GH001",
 * which causes CastErrors when used in _id queries.
 */
export const isObjectId = (value) =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
