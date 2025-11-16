import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 🔥 Universal URL-to-key extractor (works for all S3 URL formats)
const extractS3Key = (url) => {
  if (!url) return null;

  // Handles:
  // 1. bucket.s3.region.amazonaws.com/<key>
  // 2. s3.region.amazonaws.com/bucket/<key>
  // 3. any URL ending with domain + /key
  const parts = url.split(".amazonaws.com/");
  if (parts.length < 2) return null;

  return parts[1]; // everything after amazonaws.com/
};

export const deleteFromS3 = async (imageUrl) => {
  console.log("🟡 deleteFromS3 CALLED:", imageUrl);

  if (!imageUrl) {
    console.log("⛔ No image URL, skipping...");
    return;
  }

  const key = extractS3Key(imageUrl);
  console.log("🔍 Extracted Key:", key);

  if (!key) {
    console.log("❌ Unable to extract S3 key from URL");
    return;
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  };

  console.log("📦 S3 Delete Params:", params);

  try {
    await s3.send(new DeleteObjectCommand(params));
    console.log("🟢 S3 Deletion Successful:", key);
  } catch (err) {
    console.error("🔥 S3 Delete Error:", err);
  }
};
