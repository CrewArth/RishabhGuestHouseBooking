import PDFDocument from 'pdfkit';

/**
 * Creates a PDFKit document instance and returns it along with a promise that resolves
 * to the generated PDF Buffer.
 *
 * @param {Object} options - PDFDocument configuration options
 * @returns {{ doc: PDFDocument, getBuffer: () => Promise<Buffer> }}
 */
export const createPdfStream = (options = {}) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true, // Allows page numbering and footer headers across all pages
    ...options,
  });

  const buffers = [];

  doc.on('data', (chunk) => buffers.push(chunk));

  const getBuffer = () =>
    new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));
    });

  return { doc, getBuffer };
};
