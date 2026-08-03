import fs from 'fs/promises';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../../utils/s3Client.js';

const DATA_URL_REGEX = /^data:image\/[^;]+;base64,(.+)$/i;
const S3_URL_REGEX = /^https?:\/\/([^/]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)$/i;

const toFilePathFromFileUrl = (fileUrl) => {
  const withoutScheme = fileUrl.replace(/^file:\/\//i, '');
  if (/^\/[a-zA-Z]:/.test(withoutScheme)) {
    return decodeURIComponent(withoutScheme.slice(1));
  }
  return decodeURIComponent(withoutScheme);
};

export const loadImageBuffer = async (source) => {
  if (!source || typeof source !== 'string') {
    return null;
  }

  const trimmed = source.trim();
  if (!trimmed) {
    return null;
  }

  const dataMatch = trimmed.match(DATA_URL_REGEX);
  if (dataMatch) {
    return Buffer.from(dataMatch[1], 'base64');
  }

  if (/^file:\/\//i.test(trimmed)) {
    const filePath = toFilePathFromFileUrl(trimmed);
    return fs.readFile(filePath);
  }

  const s3Match = trimmed.match(S3_URL_REGEX);
  if (s3Match) {
    try {
      const [, bucket, region, key] = s3Match;
      const response = await s3.send(new GetObjectCommand({
        Bucket: bucket || process.env.AWS_S3_BUCKET,
        Key: decodeURIComponent(key),
      }));

      const body = response.Body;
      if (!body) {
        throw new Error('S3 image body was empty');
      }

      if (body.transformToByteArray) {
        return Buffer.from(await body.transformToByteArray());
      }

      const chunks = [];
      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.warn('Falling back to HTTP fetch for image source:', error.message);
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const response = await fetch(trimmed);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  return fs.readFile(trimmed);
};

export const drawImageFromSource = async (doc, source, x, y, options = {}) => {
  try {
    const imageBuffer = await loadImageBuffer(source);
    if (!imageBuffer) {
      return false;
    }

    doc.image(imageBuffer, x, y, options);
    return true;
  } catch {
    return false;
  }
};
