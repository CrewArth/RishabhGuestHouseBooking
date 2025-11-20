Admin Dashboard Charts Workflow
================================

1. Trigger
----------
- Admin navigates to the dashboard (`frontend/src/admin/pages/Overview.jsx`).
- Component mount kicks off two async fetches: summary stats and chart metrics.

2. Summary Stats Fetch
----------------------
- `fetchStats()` calls `GET /api/admin/summary`.
- Backend (`backend/controller/adminController.js#getAdminSummary`) aggregates:
  - total bookings (overall + approved/pending/rejected)
  - total users / guest houses
  - today's bookings + occupancy rate.
- Response populates the stat cards immediately; a 30s interval keeps values fresh.

3. Chart Metrics Fetch
----------------------
- `fetchMetrics()` requests both chart datasets in parallel:
  - `GET /api/admin/metrics/bookings-per-day?range=30&status=approved`
  - `GET /api/admin/metrics/top-guest-houses?range=30&limit=5&status=approved`
- While waiting, chart components show loading placeholders.

4. Backend Aggregations
-----------------------
- `getBookingsPerDay` builds a date window (default last 30 days) and groups bookings by `createdAt` day. Result format:
  ```json
  {
    "range": { "startDate": "...", "endDate": "..." },
    "data": [ { "date": "2025-11-01", "totalBookings": 12 }, ... ]
  }
  ```
- `getTopGuestHouses` groups by `guestHouseId`, counts bookings, sorts, limits, then looks up `guestHouseName` + location details.

5. Frontend Rendering
---------------------
- `BookingsPerDayChart` (Line chart):
  - Uses `react-chartjs-2` with labels derived from returned dates.
  - Displays daily totals, filled line, custom tooltip (`X bookings`).
- `TopGuestHousesChart` (Horizontal bar chart):
  - Labels = guest house names, values = booking counts.
  - Highlights top performers over the same range.
- Both components accept `data`, `loading`, `rangeLabel`; when data is empty they show friendly “No bookings in this range” messaging.

6. Auto-Refresh Loop
--------------------
- `setInterval` (30s) calls both `fetchStats` and `fetchMetrics`.
- Ensures dashboard mirrors newest bookings without manual reload.
- Cleanup: interval cleared on component unmount.

7. Extensibility Notes
----------------------
- Date range and filters are controlled via query params; UI can expose selectors later without backend changes.
- Additional charts can reuse the shared `chartConfig` module for Chart.js registration.
- API base URL isolated in `Overview.jsx` so environment configs can override it via env vars when needed.

End of workflow.

