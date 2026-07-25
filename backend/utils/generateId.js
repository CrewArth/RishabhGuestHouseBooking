/**
 * generateId(type) — returns a zero-padded, prefixed unique ID.
 *
 * Built-in prefixes:
 *   guesthouse → GH001, GH002, …
 *   room       → RM001, RM002, …
 *   bed        → BD001, BD002, …
 *   booking    → BK001, BK002, …
 *   user       → USR001, USR002, …
 *
 * Any unknown type falls back to uppercase initials + sequence,
 * e.g. "invoice" → INV001.
 *
 * Usage:
 *   const id = await generateId('guesthouse');  // "GH001"
 */

import Counter from '../models/Counter.js';

const PREFIX_MAP = {
  guesthouse: 'GH',
  room:       'RM',
  bed:        'BD',
  booking:    'BK',
  user:       'USR',
};

const pad = (n, width = 3) => String(n).padStart(width, '0');

const getPrefix = (type) => {
  const key = type.toLowerCase();
  if (PREFIX_MAP[key]) return PREFIX_MAP[key];

  // Derive initials from the type name: take up to 3 uppercase consonants/letters
  return key
    .replace(/[aeiou]/g, '')          // strip vowels for compact initials
    .slice(0, 3)
    .toUpperCase()
    || key.slice(0, 3).toUpperCase(); // fallback if all vowels
};

export const generateId = async (type) => {
  const prefix = getPrefix(type);
  const counterId = `counter_${type.toLowerCase()}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `${prefix}${pad(counter.seq)}`;
};
