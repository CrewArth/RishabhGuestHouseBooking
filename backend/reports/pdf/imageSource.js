import fs from 'fs/promises';

const DATA_URL_REGEX = /^data:image\/[^;]+;base64,(.+)$/i;

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
