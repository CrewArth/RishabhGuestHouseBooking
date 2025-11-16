// controller/adminController.js
import User from '../models/User.js';
import GuestHouse from '../models/GuestHouse.js';
import Booking from '../models/Booking.js';

// 🧠 Fetch Dashboard Summary (LIVE STATS)
export const getAdminSummary = async (req, res) => {
  try {
    // Count users and guest houses
    const totalUsers = await User.countDocuments();
    const totalGuestHouses = await GuestHouse.countDocuments();

    // Aggregate booking stats
    const totalBookings = await Booking.countDocuments();
    const approvedBookings = await Booking.countDocuments({ status: "approved" });
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const rejectedBookings = await Booking.countDocuments({ status: "rejected" });

    // Optionally: add "today's bookings" (bonus)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysBookings = await Booking.countDocuments({
      createdAt: { $gte: today }
    });

  const occupancyRate =
  totalBookings > 0 ? ((approvedBookings / totalBookings) * 100).toFixed(2) : 0;

    res.json({
      totalUsers,
      totalGuestHouses,
      totalBookings,
      approvedBookings,
      pendingBookings,
      rejectedBookings,
      todaysBookings,
      occupancyRate
    });
  } catch (error) {
    console.error("Error in admin summary:", error);
    res.status(500).json({ error: "Server error while fetching dashboard stats" });
  }
};

// 🧾 GET /api/admin/users?page=1&limit=10
export const listUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch paginated users
    const users = await User.find({}, "firstName lastName email phone address isActive createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    return res.json({
      users,
      totalUsers,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("listUsers error:", err);
    return res.status(500).json({ error: "Server error while fetching users" });
  }
};
