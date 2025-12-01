// controller/adminController.js
import User from '../models/User.js';
import GuestHouse from '../models/GuestHouse.js';
import Booking from '../models/Booking.js';
import { cache } from '../utils/redisClient.js';

// 🧠 Fetch Dashboard Summary (LIVE STATS) - with Redis caching
export const getAdminSummary = async (req, res) => {
  try {
    const cacheKey = 'admin:dashboard:summary';
    
    // Try to get from cache first
    const cachedSummary = await cache.get(cacheKey);
    
    if (cachedSummary) {
      console.log('✅ Admin dashboard summary served from Redis cache');
      return res.json(cachedSummary);
    }

    // Cache miss - fetch from database
    console.log('🟡 Cache miss - fetching dashboard stats from database');
    
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

    const summary = {
      totalUsers,
      totalGuestHouses,
      totalBookings,
      approvedBookings,
      pendingBookings,
      rejectedBookings,
      todaysBookings,
      occupancyRate
    };

    // Store in cache for 30 seconds (matches frontend refresh interval)
    await cache.set(cacheKey, summary, 30);
    console.log('✅ Dashboard summary cached in Redis');
    
    res.json(summary);
  } catch (error) {
    console.error("Error in admin summary:", error);
    res.status(500).json({ error: "Server error while fetching dashboard stats" });
  }
};

const buildDateRange = (startDateParam, endDateParam, rangeParam) => {
  const endDate = endDateParam ? new Date(endDateParam) : new Date();
  if (Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid endDate");
  }
  endDate.setHours(23, 59, 59, 999);

  let startDate;
  if (startDateParam) {
    startDate = new Date(startDateParam);
    if (Number.isNaN(startDate.getTime())) {
      throw new Error("Invalid startDate");
    }
  } else {
    const days = parseInt(rangeParam, 10) || 30;
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
  }
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
};

export const getBookingsPerDay = async (req, res) => {
  try {
    const { startDate, endDate } = buildDateRange(
      req.query.startDate,
      req.query.endDate,
      req.query.range
    );

    const matchStage = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (req.query.status && req.query.status !== "all") {
      matchStage.status = req.query.status;
    }

    const bookingsPerDay = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          totalBookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalBookings: 1,
        },
      },
    ]);

    res.json({ range: { startDate, endDate }, data: bookingsPerDay });
  } catch (error) {
    console.error("Error fetching bookings per day:", error);
    res.status(400).json({ error: error.message || "Unable to fetch data" });
  }
};

export const getTopGuestHouses = async (req, res) => {
  try {
    const { startDate, endDate } = buildDateRange(
      req.query.startDate,
      req.query.endDate,
      req.query.range
    );

    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const matchStage = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (req.query.status && req.query.status !== "all") {
      matchStage.status = req.query.status;
    }

    const topGuestHouses = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$guestHouseId",
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "guesthouses",
          localField: "_id",
          foreignField: "_id",
          as: "guestHouse",
        },
      },
      { $unwind: "$guestHouse" },
      {
        $project: {
          guestHouseId: "$_id",
          guestHouseName: "$guestHouse.guestHouseName",
          bookingCount: 1,
          location: "$guestHouse.location",
        },
      },
    ]);

    res.json({
      range: { startDate, endDate },
      data: topGuestHouses,
    });
  } catch (error) {
    console.error("Error fetching top guest houses:", error);
    res.status(400).json({ error: error.message || "Unable to fetch data" });
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
