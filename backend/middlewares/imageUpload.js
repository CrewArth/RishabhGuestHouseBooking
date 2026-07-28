// middlewares/imageUpload.js
import multer from "multer";
import sharp from "sharp";
import { s3 } from "../utils/s3Client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import GuestHouse from "../models/GuestHouse.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import os from "os";
dotenv.config();

// Get the user's Desktop folder path for local fallback storage
const getDesktopPath = () => path.join(os.homedir(), "Desktop", "RishabhGuestHouseImages");

// ── Helpers ────────────────────────────────────────────────────────────────

/** Sanitise any string for safe use in an S3 key segment. */
const slugify = (str) =>
  String(str || 'unknown')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 60) || 'unknown';

/** Today's date as YYYY-MM-DD (UTC). */
const todayUtc = () => new Date().toISOString().split('T')[0];

/** Resolve the guestHouseName string from either a plain ID or an object. */
const resolveGuestHouseName = async (guestHouseIdOrObj) => {
  if (!guestHouseIdOrObj) return 'unknown';
  if (typeof guestHouseIdOrObj === 'object' && guestHouseIdOrObj.guestHouseName) {
    return guestHouseIdOrObj.guestHouseName;
  }
  try {
    const gh = await GuestHouse.findOne({ guestHouseId: String(guestHouseIdOrObj) }).lean();
    return gh?.guestHouseName || String(guestHouseIdOrObj);
  } catch {
    return String(guestHouseIdOrObj);
  }
};

/** Upload a buffer to local Desktop storage (same folder structure as S3) and return local file URL. */
const uploadToLocal = async (key, buffer) => {
  const localPath = path.join(getDesktopPath(), key);
  const dir = path.dirname(localPath);
  
  // Create directory recursively if it doesn't exist
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(localPath, buffer);
  
  // Return file:// URL for local access
  return `file:///${localPath.replace(/\\/g, '/')}`;
};

/** Upload a buffer to S3 first; if it fails, fall back to local Desktop storage. */
const uploadImage = async (key, buffer, contentType = 'image/webp') => {
  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log(`[S3] Uploaded: ${key}`);
    return s3Url;
  } catch (s3Err) {
    console.warn(`[S3] Upload failed for ${key}, falling back to local storage:`, s3Err.message);
    const localUrl = await uploadToLocal(key, buffer);
    console.log(`[LOCAL] Saved to: ${localUrl}`);
    return localUrl;
  }
};

// ── Multer config ──────────────────────────────────────────────────────────

const multerOptions = {
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB raw upload cap
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
};

/** Single "image" field — used for guest house / room images. */
export const upload = multer(multerOptions).single('image');

/** Multi-field upload — verificationImage (1) + familyMemberImages (up to 10). */
export const uploadVerificationImage = multer(multerOptions).fields([
  { name: 'verificationImage', maxCount: 1 },
  { name: 'familyMemberImages', maxCount: 10 },
]);

// ── Middleware 1: Guest House / Room images ────────────────────────────────
/**
 * S3 path:  super-admin/{GuestHouseName}/{timestamp}_{originalName}.webp
 *
 * Resolves guest house name from:
 *   - req.body.guestHouseName  (create)
 *   - req.body.guestHouseId    (update — looks up by ID)
 *   - req.params.guestHouseId  (update route param fallback)
 *
 * Attaches: req.optimizedImageUrl
 */
export const processAndUploadImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    // Resolve guest house name
    const rawName =
      req.body.guestHouseName ||
      (await resolveGuestHouseName(req.body.guestHouseId || req.params.guestHouseId));

    const ghSlug    = slugify(rawName);
    const baseName  = slugify(req.file.originalname.replace(/\.[^.]+$/, ''));
    const key       = `super-admin/${ghSlug}/${Date.now()}_${baseName}.webp`;

    // Compress: resize to max 1280×720, convert to WebP at 72% quality
    const compressed = await sharp(req.file.buffer)
      .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();

    req.optimizedImageUrl = await uploadImage(key, compressed);
    return next();
  } catch (err) {
    console.error('[IMAGE] processAndUploadImage failed:', err);
    return res.status(500).json({ message: 'Image upload failed' });
  }
};

// ── Middleware 2: Booking verification images ──────────────────────────────
/**
 * S3 paths:
 *   Main guest:   admin/{GuestHouseName}/{YYYY-MM-DD}/{FamilyHead}/verification.webp
 *   Family member: admin/{GuestHouseName}/{YYYY-MM-DD}/{FamilyHead}/members/{MemberName}/img.webp
 *
 * Resolves guest house name from req.body.guestHouseId (DB lookup).
 * Family head name from req.body.fullName.
 *
 * Attaches: req.verificationImageUrl, req.familyMemberImageUrls (object keyed by index)
 */
export const processAndUploadVerificationImage = async (req, res, next) => {
  try {
    const date        = todayUtc();
    const ghName      = await resolveGuestHouseName(req.body.guestHouseId);
    const ghSlug      = slugify(ghName);
    const headSlug    = slugify(req.body.fullName || 'GUEST');
    const folderBase  = `admin/${ghSlug}/${date}/${headSlug}`;

    // ── Main guest verification image ────────────────────────────────────
    const verificationFile = req.files?.verificationImage?.[0];
    req.verificationImageUrl = null;

    if (verificationFile) {
      const compressed = await sharp(verificationFile.buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const key = `${folderBase}/${headSlug}_${slugify(req.body.identityType || 'document')}.webp`;
      try {
        req.verificationImageUrl = await uploadImage(key, compressed);
      } catch (err) {
        console.error('[IMAGE] Verification image upload failed:', err);
        return res.status(500).json({ message: 'Verification image upload failed' });
      }
    }

    // ── Family member images ──────────────────────────────────────────────
    const familyMemberFiles = req.files?.familyMemberImages || [];
    req.familyMemberImageUrls = {};

    let familyMembersData = [];
    try {
      familyMembersData = req.body.familyMembers
        ? JSON.parse(req.body.familyMembers)
        : [];
    } catch { familyMembersData = []; }

    for (const file of familyMemberFiles) {
      // Index encoded in originalname as "idx_N_<name>" by the frontend
      const idxMatch  = file.originalname.match(/^idx_(\d+)_/);
      const fileIndex = idxMatch ? parseInt(idxMatch[1], 10) : familyMemberFiles.indexOf(file);
      const memberName = slugify(familyMembersData[fileIndex]?.name || `member${fileIndex}`);

      const compressed = await sharp(file.buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const key = `${folderBase}/members/${memberName}/img.webp`;
      try {
        req.familyMemberImageUrls[fileIndex] = await uploadImage(key, compressed);
      } catch (err) {
        console.error(`[IMAGE] Family member image upload failed (index ${fileIndex}):`, err);
        // Non-fatal: continue without this image rather than failing the whole booking
        req.familyMemberImageUrls[fileIndex] = null;
      }
    }

    return next();
  } catch (err) {
    console.error('[S3] processAndUploadVerificationImage failed:', err);
    return res.status(500).json({ message: 'Verification image upload failed' });
  }
};
