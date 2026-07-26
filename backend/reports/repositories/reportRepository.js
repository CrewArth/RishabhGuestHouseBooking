import { getBookingByGuestHouseData } from '../aggregations/bookingByGuestHouse.js';
import { getMonthlyRevenueByGuestHouseData } from '../aggregations/monthlyRevenueByGuestHouse.js';

export const fetchReportData = async (reportId, filters) => {
  switch (reportId) {
    case 'bookingByGuestHouse':
      return await getBookingByGuestHouseData(filters);
    case 'monthlyRevenueByGuestHouse':
      return await getMonthlyRevenueByGuestHouseData(filters);
    default:
      throw new Error(`Aggregation for report '${reportId}' is not implemented.`);
  }
};
