import { REPORTS, getReportById, isReportAllowed } from '../constants/reportsRegistry.js';
import { fetchReportData } from '../repositories/reportRepository.js';
import { generateBookingByGuestHousePdf } from '../pdf/templates/bookingByGuestHousePdf.js';
import User from '../../models/User.js';
import GuestHouse from '../../models/GuestHouse.js';
import { logAction } from '../../utils/auditLogger.js';

export const listAllowedReportsForUser = (user) => {
  return REPORTS.filter((report) => isReportAllowed(user, report.id));
};

export const getReportFilterOptions = async (reportId, user) => {
  const reportConfig = getReportById(reportId);
  if (!reportConfig) {
    throw new Error(`Report '${reportId}' not found`);
  }

  if (!isReportAllowed(user, reportId)) {
    throw new Error(`Permission denied for report '${reportId}'`);
  }

  // Fetch dynamic dropdown choices for filters
  const guestHouses = await GuestHouse.find({ maintenance: false }, "guestHouseId guestHouseName location").lean();

  return {
    report: reportConfig,
    guestHouses,
  };
};

export const generateReportPdf = async (reportId, filters, user) => {
  const reportConfig = getReportById(reportId);
  if (!reportConfig) {
    throw new Error(`Report '${reportId}' not found`);
  }

  if (!isReportAllowed(user, reportId)) {
    throw new Error(`Access denied for report '${reportId}'`);
  }

  // Fetch report dataset via Aggregation Pipelines
  const data = await fetchReportData(reportId, filters);

  const performerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Admin';

  let pdfBuffer;
  switch (reportId) {
    case 'bookingByGuestHouse':
      pdfBuffer = await generateBookingByGuestHousePdf(data, filters, { createdBy: performerName });
      break;
    default:
      throw new Error(`PDF generation template for report '${reportId}' is not implemented.`);
  }

  // Audit log action
  logAction({
    action: "REPORT_GENERATED",
    entityType: "Report",
    entityId: reportId,
    performedBy: user.email || "Admin",
    details: { reportId, filters },
  }).catch((err) => console.error("Report generation audit log error:", err));

  return pdfBuffer;
};

export const getAdminReportPermissions = async (adminId) => {
  const user = await User.findById(adminId, "firstName lastName email role allowedReports");
  if (!user) {
    throw new Error("Admin not found");
  }
  return user;
};

export const updateAdminReportPermissions = async (adminId, allowedReports, performerEmail) => {
  if (allowedReports !== null && !Array.isArray(allowedReports)) {
    throw new Error("allowedReports must be an array of report IDs or null");
  }

  const user = await User.findById(adminId);
  if (!user) {
    throw new Error("Admin not found");
  }

  user.allowedReports = allowedReports;
  await user.save();

  logAction({
    action: "REPORT_PERMISSIONS_UPDATED",
    entityType: "User",
    entityId: user._id,
    performedBy: performerEmail || "SuperAdmin",
    details: { allowedReports },
  }).catch((err) => console.error("Audit log error:", err));

  return user;
};
