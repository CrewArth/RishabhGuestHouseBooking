// controller/adminController.js
import mongoose from 'mongoose';
import User from '../models/User.js';
import GuestHouse from '../models/GuestHouse.js';
import Booking from '../models/Booking.js';
import { sendEmail } from '../utils/emailService.js';
import { adminCreatedUserEmail } from '../utils/emailTemplates/adminCreatedUser.js';
import { logAction } from '../utils/auditLogger.js';
import { normalizeUser } from '../utils/roles.js';

/**
 * Returns a MongoDB filter object scoped to the user's assigned guest house.
 * SUPER_ADMIN → no filter (empty object, sees everything).
 * ADMIN with assignedGuestHouseId → { guestHouseId: <ObjectId> }.
 * ADMIN without assignment → no restriction (same as SUPER_ADMIN).
 */
const getGuestHouseFilter = async (user) => {
  if (user?.role === 'ADMIN' && user.assignedGuestHouseId) {
    const ghId = typeof user.assignedGuestHouseId === 'object'
      ? user.assignedGuestHouseId.guestHouseId
      : user.assignedGuestHouseId;
    if (ghId) {
      const isObjectId = mongoose.Types.ObjectId.isValid(ghId);
      const gh = await GuestHouse.findOne({
        $or: [
          { guestHouseId: ghId },
          ...(isObjectId ? [{ _id: ghId }] : []),
        ],
      }).lean();
      if (gh) return { guestHouseId: gh._id };
    }
  }
  return {};
};

// Fetch Dashboard Summary (LIVE STATS)
export const getAdminSummary = async (req, res) => {
  try {
    const bookingQuery = await getGuestHouseFilter(req.user);

    const totalUsers = await User.countDocuments();
    const totalGuestHouses = await GuestHouse.countDocuments();

    const totalBookings = await Booking.countDocuments(bookingQuery);
    const approvedBookings = await Booking.countDocuments({ ...bookingQuery, status: "approved" });
    const pendingBookings = await Booking.countDocuments({ ...bookingQuery, status: "pending" });
    const cancelledBookings = await Booking.countDocuments({ ...bookingQuery, status: "cancelled" });
    const rejectedBookings = await Booking.countDocuments({ ...bookingQuery, status: "rejected" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysBookings = await Booking.countDocuments({
      ...bookingQuery,
      $or: [
        { createdAt: { $gte: today } },
        { checkIn: { $lte: new Date() }, checkOut: { $gte: today } }
      ]
    });

    const occupancyRate =
      totalBookings > 0 ? ((approvedBookings / totalBookings) * 100).toFixed(2) : 0;

    const summary = {
      totalUsers,
      totalGuestHouses,
      totalBookings,
      approvedBookings,
      pendingBookings,
      cancelledBookings,
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
      ...await getGuestHouseFilter(req.user),
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
      ...await getGuestHouseFilter(req.user),
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

// PATCH /api/admin/users/:id/assign-guesthouse  (SUPER_ADMIN only)
export const assignGuestHouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { guestHouseId } = req.body; // null to unassign

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Admin not found' });
    if (user.role !== 'ADMIN') return res.status(400).json({ error: 'Guest house can only be assigned to ADMIN accounts' });

    let guestHouse = null;
    if (guestHouseId) {
      const isObjectId = mongoose.Types.ObjectId.isValid(guestHouseId);
      guestHouse = await GuestHouse.findOne({
        $or: [
          { guestHouseId: guestHouseId },
          ...(isObjectId ? [{ _id: guestHouseId }] : []),
        ],
      });
      if (!guestHouse) return res.status(404).json({ error: 'Guest house not found' });
    }

    const assignedId = guestHouse ? guestHouse.guestHouseId : null;
    user.assignedGuestHouseId = assignedId;
    await user.save();

    await logAction({
      action: assignedId ? 'GUESTHOUSE_ASSIGNED' : 'GUESTHOUSE_UNASSIGNED',
      entityType: 'User',
      entityId: user._id,
      performedBy: req.user?.email || 'SuperAdmin',
      details: { assignedGuestHouseId: assignedId },
    });

    // Manually populate assignedGuestHouse
    const userObj = user.toObject();
    if (guestHouse) {
      userObj.assignedGuestHouseId = guestHouse;
    }

    res.json({ message: assignedId ? 'Guest house assigned' : 'Guest house unassigned', user: userObj });
  } catch (err) {
    console.error('Error assigning guest house:', err);
    res.status(500).json({ error: 'Server error while assigning guest house' });
  }
};

// GET /api/admin/me  — returns the logged-in admin with their assigned guest house
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Manually populate assignedGuestHouseId if exists
    if (user.assignedGuestHouseId) {
      const guestHouse = await GuestHouse.findOne({ guestHouseId: user.assignedGuestHouseId }).lean();
      user.assignedGuestHouseId = guestHouse;
    }

    res.json({ user });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// 🧾 GET /api/admin/users?page=1&limit=10
export const listUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch paginated users — only ADMIN and SUPER_ADMIN, not guest USER records
    let users = await User.find(
      { role: { $in: ["ADMIN", "SUPER_ADMIN"] } },
      "firstName lastName email phone address role isActive createdAt assignedGuestHouseId allowedWidgets allowedReports eSignatureUrl"
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Manually populate assignedGuestHouseId
    const guestHouseIds = [...new Set(users.map(u => u.assignedGuestHouseId).filter(Boolean))];
    const guestHouses = await GuestHouse.find({ guestHouseId: { $in: guestHouseIds } }).lean();
    const guestHouseMap = {};
    guestHouses.forEach(gh => guestHouseMap[gh.guestHouseId] = gh);

    users = users.map(user => ({
      ...user,
      assignedGuestHouseId: guestHouseMap[user.assignedGuestHouseId] || user.assignedGuestHouseId
    }));

    const totalUsers = await User.countDocuments({ role: { $in: ["ADMIN", "SUPER_ADMIN"] } });
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
    const eSignatureUrl = req.eSignatureUrl || null;

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
      $or: [{ email }, { phone: String(phone).trim() }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ 
          error: "User with this email already exists." 
        });
      }
      if (existingUser.phone === String(phone).trim()) {
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
      phone: String(phone).trim(),
      address: address ? address.trim() : "",
      password,
      role: "ADMIN",
      isActive: true,
      eSignatureUrl,
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

// PATCH /api/admin/users/:id/widgets (SUPER_ADMIN only)
export const updateUserWidgets = async (req, res) => {
  try {
    const { id } = req.params;
    const { allowedWidgets } = req.body;

    if (allowedWidgets !== null && !Array.isArray(allowedWidgets)) {
      return res.status(400).json({ error: "allowedWidgets must be an array of widget IDs or null" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.allowedWidgets = allowedWidgets;
    await user.save();

    await logAction({
      action: "USER_WIDGETS_UPDATED",
      entityType: "User",
      entityId: user._id,
      performedBy: req.user?.email || "SuperAdmin",
      details: { allowedWidgets },
    });

    res.json({
      message: "Widget permissions updated successfully",
      user: normalizeUser(user.toObject()),
    });
  } catch (err) {
    console.error("Error updating user widgets:", err);
    res.status(500).json({ error: "Server error while updating widget permissions" });
  }
};
