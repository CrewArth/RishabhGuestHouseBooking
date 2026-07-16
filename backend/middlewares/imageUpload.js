// middlewares/imageUpload.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import sharp from "sharp";
import { s3 } from "../utils/s3Client.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const storage = multer.memoryStorage(); // store in memory to process with Sharp
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.resolve(__dirname, "..", "images");

const getBaseName = (originalname) => path.parse(originalname).name.replace(/[^a-zA-Z0-9_-]/g, "_");

const saveVerificationImageLocally = async (req, fileName, buffer) => {
  const localPath = path.join(imagesDir, fileName);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, buffer);
  return `${req.protocol}://${req.get("host")}/images/${fileName.replace(/\\/g, "/")}`;
};

const uploadOptions = {
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"), false);
      return;
    }

    cb(null, true);
  },
};

export const upload = multer(uploadOptions).single("image");
export const uploadVerificationImage = multer(uploadOptions).single("verificationImage");

// 🔥 Function to process + upload optimized image
export const processAndUploadImage = async (req, res, next) => {
  try {
    if (req.file) {
      // 1️⃣ Resize + convert to WebP (very lightweight)
      const optimizedImage = await sharp(req.file.buffer)
        .resize(1280, 720, { fit: "cover" }) // fixed resolution
        .webp({ quality: 70 }) // compress
        .toBuffer();

      // 2️⃣ Generate unique name
      const fileName = `guesthouses/${Date.now()}_${req.file.originalname.split(".")[0]}.webp`;

      // 3️⃣ Upload to S3
      try {
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileName,
          Body: optimizedImage,
          ContentType: "image/webp",
        };

        await s3.send(new PutObjectCommand(uploadParams));
      } catch (error) {
        console.error("Error Uploading Image: ", error);
      }

      // 4️⃣ Attach final URL to request
      req.optimizedImageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      /* This image URL is later used to store in MongoDB database.  */

      console.log("Optimized image uploaded:", req.optimizedImageUrl);
    }

    next();
  } catch (err) {
    console.error("Image optimization failed:", err);
    return res.status(500).json({ message: "Image processing failed" });
  }
};

export const processAndUploadVerificationImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const optimizedImage = await sharp(req.file.buffer)
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const fileName = `booking-verifications/${Date.now()}_${getBaseName(req.file.originalname)}.webp`;

    try {
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: optimizedImage,
        ContentType: "image/webp",
      }));

      req.verificationImageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error("Verification image upload failed, saving locally:", error);
      req.verificationImageUrl = await saveVerificationImageLocally(req, fileName, optimizedImage);
    }

    return next();
  } catch (error) {
    console.error("Verification image upload failed:", error);
    return res.status(500).json({ message: "Verification image upload failed" });
  }
};
