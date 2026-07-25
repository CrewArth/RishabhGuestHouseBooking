import { getBookingByGuestHouseData } from '../aggregations/bookingByGuestHouse.js';

export const fetchReportData = async (reportId, filters) => {
  switch (reportId) {
    case 'bookingByGuestHouse':
      return await getBookingByGuestHouseData(filters);
    default:
      throw new Error(`Aggregation for report '${reportId}' is not implemented.`);
  }
};
