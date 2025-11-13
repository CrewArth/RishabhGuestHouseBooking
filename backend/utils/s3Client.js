import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

// ✅ Reuse the same config across upload & delete
export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Function to safely delete a file from S3
export const deleteFromS3 = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    // Extract object key from the URL
    const key = imageUrl.split(".amazonaws.com/")[1];
    if (!key) {
      console.warn("⚠️ Could not extract key from image URL:", imageUrl);
      return;
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME || "rishabh-guest-house-images",
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(params));
    console.log(`🗑️ Deleted image from S3: ${key}`);
  } catch (err) {
    console.error("⚠️ Failed to delete image from S3:", err.message);
  }
};
