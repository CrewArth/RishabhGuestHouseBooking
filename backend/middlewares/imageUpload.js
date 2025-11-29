// middlewares/imageUpload.js
import multer from "multer";
import sharp from "sharp";
import { s3 } from "../utils/s3Client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const storage = multer.memoryStorage(); // store in memory to process with Sharp

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"), false);
    } else {
      cb(null, true);
    }
  }
}).single("image");

// 🔥 Function to process + upload optimized image
export const processAndUploadImage = async (req, res, next) => {
  try {
    if (!req.file) return next(); // no image uploaded

    // 1️⃣ Resize + convert to WebP (very lightweight)
    const optimizedImage = await sharp(req.file.buffer)
      .resize(1280, 720, { fit: "cover" }) // fixed resolution
      .webp({ quality: 70 }) // compress
      .toBuffer();

    // 2️⃣ Generate unique name
    const fileName = `guesthouses/${Date.now()}_${req.file.originalname.split(".")[0]}.webp`;

    // 3️⃣ Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: optimizedImage,
      ContentType: "image/webp",
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // 4️⃣ Attach final URL to request
    req.optimizedImageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    /* This image URL is later used to store in MongoDB database.  */

    console.log("Optimized image uploaded:", req.optimizedImageUrl);

    next();
  } catch (err) {
    console.error("Image optimization failed:", err);
    return res.status(500).json({ message: "Image processing failed" });
  }
};
