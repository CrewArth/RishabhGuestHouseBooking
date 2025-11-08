// middlewares/imageUpload.js
import multer from "multer";
import multerS3 from "multer-s3-v3";  // If using SDK v3, change import here
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// ❌ Remove 'acl: "public-read"' from config
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME || "rishabh-guest-house-images",
    // acl: "public-read",   <-- Remove this line, as bucket ACLs are disabled
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueName = `guesthouses/${Date.now()}_${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
});

export default upload;
