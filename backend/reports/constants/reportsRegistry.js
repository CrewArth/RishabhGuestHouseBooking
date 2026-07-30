/**
 * Centralized Reports Registry & Metadata
 */

export const REPORTS = [
  {
    id: "bookingByGuestHouse",
    name: "Booking Report",
    description: "Detailed report listing all bookings for a selected guest house within a specified date range.",
    defaultEnabled: true,
    supportedFilters: ["fromDate", "toDate", "guestHouseId"],
  },
  {
    id: "monthlyRevenueByGuestHouse",
    name: "Monthly Revenue by Guest House",
    description: "Revenue report showing room-wise earnings for a selected guest house. Filter by month/year or a custom date range.",
    defaultEnabled: true,
    supportedFilters: ["month", "year", "guestHouseId", "fromDate", "toDate"],
  },
  {
    id: "invoice",
    name: "Invoice",
    description: "PDF invoice generated after payment completion.",
    defaultEnabled: true,
    supportedFilters: [],
  },
];

export const getAllReportIds = () => REPORTS.map((r) => r.id);

export const getReportById = (id) => REPORTS.find((r) => r.id === id);

export const isReportAllowed = (user, reportId) => {
  if (reportId === 'invoice') return true;
  if (!user) return true;
  const userRole = String(user.role || "").toUpperCase();
  if (userRole === "SUPER_ADMIN") return true;

  const allowed = user.allowedReports;
  if (allowed === null || allowed === undefined) return true;
  if (Array.isArray(allowed)) return allowed.includes(reportId);
  return false;
};
