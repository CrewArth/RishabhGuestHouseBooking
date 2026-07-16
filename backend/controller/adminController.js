// controller/adminController.js
import User from '../models/User.js';
import GuestHouse from '../models/GuestHouse.js';
import Booking from '../models/Booking.js';
import { sendEmail } from '../utils/emailService.js';
import { adminCreatedUserEmail } from '../utils/emailTemplates/adminCreatedUser.js';
import { logAction } from '../utils/auditLogger.js';
import { normalizeUser } from '../utils/roles.js';

// Fetch Dashboard Summary (LIVE STATS)
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

// ✨ POST /api/admin/users - Create user by admin
export const createUserByAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ 
        error: "First name, last name, email, phone, and password are required." 
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long.",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Please provide a valid email address." 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone: Number(phone) }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ 
          error: "User with this email already exists." 
        });
      }
      if (existingUser.phone === Number(phone)) {
        return res.status(400).json({ 
          error: "User with this phone number already exists." 
        });
      }
    }

    // Create new admin account
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: Number(phone),
      address: address ? address.trim() : "",
      password,
      role: "ADMIN",
      isActive: true,
    });

    await newUser.save();

    // Get admin email from request (if available) or use "Admin"
    const performerEmail = req.user?.email || "Admin";

    // Send response immediately
    res.status(201).json({
      message: "Admin account created successfully.",
      user: {
        ...normalizeUser(newUser.toObject()),
      },
    });

    // Send email asynchronously (don't block response)
    sendEmail({
      to: newUser.email,
      subject: "Your Rishabh Guest House Account Has Been Created",
      html: adminCreatedUserEmail(newUser),
    }).catch(err => {
      console.error("❌ Email send error for admin-created user:", err);
    });

    // Log action asynchronously (don't block response)
    logAction({
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: newUser._id,
      performedBy: performerEmail,
      details: {
        name: `${newUser.firstName} ${newUser.lastName}`.trim(),
        email: newUser.email,
        phone: newUser.phone,
        createdByAdmin: true,
      },
    }).catch(err => {
      console.error("❌ Audit log error:", err);
    });

  } catch (error) {
    console.error("Error creating user by admin:", error);
    
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: `User with this ${field} already exists.`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: messages.join(", ")
      });
    }

    return res.status(500).json({
      error: "Server error while creating user."
    });
  }
};
