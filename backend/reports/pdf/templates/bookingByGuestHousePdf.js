import { createPdfStream } from '../pdfGenerator.js';

const formatDateStr = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(val);
  }
};

const formatDateTimeStr = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
};

/**
 * Generates PDF for "Booking by Guest House" report.
 *
 * @param {Object} data - { guestHouse, bookings }
 * @param {Object} filters - { fromDate, toDate }
 * @param {Object} meta - { createdBy }
 * @returns {Promise<Buffer>}
 */
export const generateBookingByGuestHousePdf = async (data, filters, meta) => {
  const { doc, getBuffer } = createPdfStream();
  const { guestHouse, bookings = [] } = data;
  const performerName = meta?.createdBy || 'Admin';
  const generatedOn = formatDateTimeStr(new Date());

  const startY = 40;
  let y = startY;

  // 1. Header (Centered at top)
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f172a')
    .text(guestHouse?.guestHouseName || 'Guest House', { align: 'center' });
  y = doc.y + 4;

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#334155')
    .text('Booking by Guest House Report', { align: 'center' });
  y = doc.y + 12;

  // Divider line
  doc.moveTo(40, y).lineTo(555, y).strokeColor('#cbd5e1').lineWidth(1).stroke();
  y += 14;

  // 2. Filters Section
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text('Filters', 40, y);
  y += 14;

  const drawFilterRow = (label, value) => {
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text(`${label}:`, 40, y, { width: 90 });
    doc.fontSize(9).font('Helvetica').fillColor('#0f172a').text(value || 'All', 130, y);
    y += 14;
  };

  drawFilterRow('From Date', filters.fromDate ? formatDateStr(filters.fromDate) : 'All Time');
  drawFilterRow('To Date', filters.toDate ? formatDateStr(filters.toDate) : 'All Time');
  drawFilterRow('Guest House', `${guestHouse.guestHouseName} (${guestHouse.guestHouseId})`);

  y += 8;
  doc.moveTo(40, y).lineTo(555, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
  y += 14;

  // 3. Table Column Layout Definition
  const cols = [
    { label: 'Booking No', x: 40, w: 65, align: 'left' },
    { label: 'Guest Name', x: 105, w: 110, align: 'left' },
    { label: 'Room / Bed', x: 215, w: 85, align: 'left' },
    { label: 'Check In', x: 300, w: 70, align: 'center' },
    { label: 'Check Out', x: 370, w: 70, align: 'center' },
    { label: 'Status', x: 440, w: 55, align: 'center' },
    { label: 'Applied', x: 495, w: 60, align: 'center' },
  ];

  const drawTableHeader = (currentY) => {
    // Header Background
    doc.rect(40, currentY, 515, 20).fill('#f1f5f9');

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1e293b');
    cols.forEach((c) => {
      doc.text(c.label, c.x + 3, currentY + 5, { width: c.w - 6, align: c.align });
    });

    doc.rect(40, currentY, 515, 20).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    return currentY + 20;
  };

  y = drawTableHeader(y);

  // Render Rows
  if (bookings.length === 0) {
    doc.rect(40, y, 515, 25).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748b')
      .text('No bookings found matching the selected filters.', 45, y + 8, { align: 'center', width: 505 });
    y += 25;
  } else {
    bookings.forEach((b, index) => {
      // Check for page break (leave room for footer at 777)
      if (y > 730) {
        doc.addPage();
        y = 40;
        y = drawTableHeader(y);
      }

      const rowHeight = 22;

      // Alternating row background
      if (index % 2 === 1) {
        doc.rect(40, y, 515, rowHeight).fill('#f8fafc');
      }

      doc.font('Helvetica').fontSize(8).fillColor('#0f172a');

      // Booking No
      const bNo = String(b.bookingNo || b._id?.toString().substring(18) || '—').toUpperCase();
      doc.text(bNo, cols[0].x + 3, y + 6, { width: cols[0].w - 6, align: cols[0].align });

      // Guest Name
      const gName = b.guestName?.trim() || b.fullName || '—';
      doc.text(gName, cols[1].x + 3, y + 6, { width: cols[1].w - 6, align: cols[1].align, ellipsis: true });

      // Room / Bed
      let roomBedStr = b.roomNumber ? `R-${b.roomNumber}` : '—';
      if (b.bedNumber) roomBedStr += ` / B-${b.bedNumber}`;
      doc.text(roomBedStr, cols[2].x + 3, y + 6, { width: cols[2].w - 6, align: cols[2].align, ellipsis: true });

      // Check In
      doc.text(formatDateStr(b.checkIn), cols[3].x + 3, y + 6, { width: cols[3].w - 6, align: cols[3].align });

      // Check Out
      doc.text(formatDateStr(b.checkOut), cols[4].x + 3, y + 6, { width: cols[4].w - 6, align: cols[4].align });

      // Status
      const statusText = String(b.status || 'pending').toUpperCase();
      doc.text(statusText, cols[5].x + 3, y + 6, { width: cols[5].w - 6, align: cols[5].align });

      // Applied Date
      doc.text(formatDateStr(b.createdAt), cols[6].x + 3, y + 6, { width: cols[6].w - 6, align: cols[6].align });

      // Border line for row
      doc.rect(40, y, 515, rowHeight).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      y += rowHeight;
    });
  }

  // 4. Header & Footer pagination pass
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const footerY = 785;

    // Line above footer
    doc.moveTo(40, footerY - 8).lineTo(555, footerY - 8).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

    // Bottom-Left: Created By
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b')
      .text(`Created By: ${performerName}`, 40, footerY, { lineBreak: false });

    // Bottom-Right: Generated On
    doc.font('Helvetica').fontSize(8).fillColor('#64748b')
      .text(`Generated On: ${generatedOn}   |   Page ${i + 1} of ${range.count}`, 250, footerY, { align: 'right', width: 305, lineBreak: false });
  }

  doc.end();
  return getBuffer();
};
