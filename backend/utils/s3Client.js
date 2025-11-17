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

// Extract key ONLY if the URL belongs to your S3 bucket
const extractS3Key = (url) => {
  if (!url) return null;

  const bucketBase = `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

  if (!url.includes(bucketBase)) {
    console.warn("URL is not from S3 bucket → Skip deletion:", url);
    return null;
  }

  return url.split(bucketBase)[1]; // return everything after the bucket prefix
};


export const deleteFromS3 = async (imageUrl) => {
  console.log("🟡 deleteFromS3 CALLED:", imageUrl);
  
  if (!imageUrl) {
    console.log("⛔ No image URL, skipping...");
    return { success: true, skipped: true };
  }

  const key = extractS3Key(imageUrl);
  console.log("🔍 Extracted Key:", key);

  if (!key) {
    console.log("❌ Unable to extract S3 key from URL");
    return { success: false, error: "Invalid S3 URL format" };
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  };

  console.log("📦 S3 Delete Params:", params);

  try {
    await s3.send(new DeleteObjectCommand(params));
    console.log("🟢 S3 Deletion Successful:", key);
    return { success: true, key };
  } catch (err) {
    console.error("🔥 S3 Delete Error:", err);
    // S3 returns 204 even if file doesn't exist, but other errors should be caught
    return { success: false, error: err.message };
  }
};