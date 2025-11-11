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

    let occupancyRate = 0;
    if (totalGuestHouses > 0) {
      occupancyRate = ((approvedBookings / totalGuestHouses) * 100).toFixed(2);
    }

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

// 🧾 GET /api/admin/users
export const listUsers = async (req, res) => {
  try {
    const users = await User.find({}, "firstName lastName email isActive").lean();
    return res.json({ users });
  } catch (err) {
    console.error("listUsers error:", err);
    return res.status(500).json({ error: "Server error while fetching users" });
  }
};
