/**
 * Centralized Reports Registry & Metadata
 */

export const REPORTS = [
  {
    id: "bookingByGuestHouse",
    name: "Booking by Guest House",
    description: "Detailed report listing all bookings for a selected guest house within a specified date range.",
    defaultEnabled: true,
    supportedFilters: ["fromDate", "toDate", "guestHouseId"],
  },
  {
    id: "monthlyRevenueByGuestHouse",
    name: "Monthly Revenue by Guest House",
    description: "Revenue report showing room-wise earnings for a selected guest house during a specific month.",
    defaultEnabled: true,
    supportedFilters: ["month", "year", "guestHouseId"],
  },
];

export const getAllReportIds = () => REPORTS.map((r) => r.id);

export const getReportById = (id) => REPORTS.find((r) => r.id === id);

export const isReportAllowed = (user, reportId) => {
  if (!user) return true;
  const userRole = String(user.role || "").toUpperCase();
  if (userRole === "SUPER_ADMIN") return true;

  const allowed = user.allowedReports;
  if (allowed === null || allowed === undefined) return true;
  if (Array.isArray(allowed)) return allowed.includes(reportId);
  return false;
};
