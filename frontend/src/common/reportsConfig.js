/**
 * Centralized Frontend Reports Configuration & Metadata
 */

export const REPORTS = [
  {
    id: "bookingByGuestHouse",
    name: "Booking by Guest House",
    description: "",
    defaultEnabled: true,
    supportedFilters: ["fromDate", "toDate", "guestHouseId"],
  },
];

export const getAllReportIds = () => REPORTS.map((r) => r.id);

export const isReportAllowed = (user, reportId) => {
  if (!user) return true;
  const userRole = String(user.role || '').toUpperCase();
  if (userRole === 'SUPER_ADMIN') return true;

  const allowed = user.allowedReports;
  if (allowed === null || allowed === undefined) return true;
  if (Array.isArray(allowed)) return allowed.includes(reportId);
  return false;
};
