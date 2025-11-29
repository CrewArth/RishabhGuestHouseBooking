// controllers/bookingController.js
import Booking from "../models/Booking.js";
import Bed from "../models/Bed.js";
import Room from "../models/Room.js";
import { logAction } from "../utils/auditLogger.js";
import { sendEmail } from '../utils/emailService.js';
import User from '../models/User.js';
import GuestHouse from '../models/GuestHouse.js';
import { bookingRequest } from "../utils/emailTemplates/bookingRequest.js";
import { bookingStatusUpdate } from "../utils/emailTemplates/bookingStatusUpdate.js";


// 🟢 Create a new booking (user)
export const createBooking = async (req, res) => {
  try {
    const { guestHouseId, roomId, bedId, checkIn, checkOut } = req.body;
    const userId = req.user?._id || req.body.userId;

    if (!guestHouseId || !roomId || !bedId || !checkIn || !checkOut) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Parallelize database queries for better performance
    const [user, guestHouse, overlap] = await Promise.all([
      User.findById(userId),
      GuestHouse.findById(guestHouseId),
      Booking.findOne({
        bedId,
        status: "approved",
        $or: [
          { checkIn: { $lte: new Date(checkOut) }, checkOut: { $gte: new Date(checkIn) } },
        ],
      })
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!guestHouse) {
      return res.status(404).json({ message: "Guest house not found" });
    }

    if (overlap) {
      return res.status(400).json({ message: "This bed is already booked for the selected dates" });
    }

    const newBooking = new Booking({
      userId: req.body.userId,
      guestHouseId: req.body.guestHouseId,
      roomId: req.body.roomId,
      bedId: req.body.bedId,
      checkIn: req.body.checkIn,
      checkOut: req.body.checkOut,
      fullName: req.body.fullName,
      phone: req.body.phone,
      address: req.body.address,
      specialRequests: req.body.specialRequests,
    });

    // ✅ Save it in MongoDB
    await newBooking.save();

    // Send response immediately
    res.status(201).json({ message: "Booking request submitted", newBooking });

    // Fire-and-forget: Send email asynchronously (don't block response)
    sendEmail({
      to: user.email,
      subject: "📅 Booking Request Submitted",
      html: bookingRequest(user, newBooking, guestHouse),
    }).catch(err => console.error("Email send error:", err));

    // Fire-and-forget: Log action asynchronously (don't block response)
    logAction({
      action: "BOOKING_CREATED",
      entityType: "Booking",
      entityId: newBooking._id,
      performedBy: req.user?.email || "User",
      details: { guestHouseId, roomId, bedId, checkIn, checkOut },
    }).catch(err => console.error("Audit log error:", err));

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error creating booking" });
  }
};

// 🟡 Get all bookings (admin)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "email firstName lastName")
      .populate("guestHouseId", "guestHouseName")
      .populate("roomId", "roomNumber")
      .populate("bedId", "bedNumber bedType")
      .sort({ createdAt: -1 }); // ✅ Sort newest first

    res.json({ bookings });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ message: "Server error fetching bookings" });
  }
};

//Exporting Daily Bookings
export const exportDailyBookings = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: "date query parameter is required (YYYY-MM-DD)" });
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const bookings = await Booking.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate("userId", "firstName lastName email phone")
      .populate("guestHouseId", "guestHouseName")
      .populate("roomId", "roomNumber")
      .populate("bedId", "bedNumber bedType")
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Applied On",
      "Status",
      "Guest House",
      "User Name",
      "User Email",
      "User Phone",
      "Check In",
      "Check Out",
      "Room",
      "Bed",
      "Special Requests"
    ];

    const escapeValue = (value) => {
      if (value === null || value === undefined) return '""';
      const stringValue = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const rows = bookings.map((b) => [
      escapeValue(new Date(b.createdAt).toISOString()),
      escapeValue(b.status),
      escapeValue(b.guestHouseId?.guestHouseName || ""),
      escapeValue(`${b.userId?.firstName || ""} ${b.userId?.lastName || ""}`.trim()),
      escapeValue(b.userId?.email || ""),
      escapeValue(b.userId?.phone || ""),
      escapeValue(new Date(b.checkIn).toISOString()),
      escapeValue(new Date(b.checkOut).toISOString()),
      escapeValue(b.roomId?.roomNumber ? `Room ${b.roomId.roomNumber}` : ""),
      escapeValue(
        b.bedId?.bedNumber
          ? `Bed ${b.bedId.bedNumber} (${b.bedId.bedType})`
          : ""
      ),
      escapeValue(b.specialRequests || ""),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bookings-${date}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting daily bookings:", error);
    return res
      .status(500)
      .json({ success: false, error: "Server error while exporting bookings" });
  }
};

// 🟢 Get bookings for current user
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    const bookings = await Booking.find({ userId })
      .populate("guestHouseId", "guestHouseName location")
      .populate("roomId", "roomNumber")
      .populate("bedId", "bedNumber bedType")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Server error fetching user bookings" });
  }
};

// 🟢 Approve booking
export const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Fetch booking first
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 2️⃣ Fetch related user and guest house
    const user = await User.findById(booking.userId);
    const guestHouse = await GuestHouse.findById(booking.guestHouseId);

    // 3️⃣ Update booking status
    booking.status = "approved";
    await booking.save();

    // 4️⃣ Mark bed as unavailable
    await Bed.findByIdAndUpdate(booking.bedId, { isAvailable: false });

    // 5️⃣ Send email notification to user
    try {
      await sendEmail({
        to: user.email,
        subject: "✅ Booking Approved",
        html: bookingStatusUpdate(user, booking, guestHouse, "approved"),
      });
      console.log(`📧 Approval email sent to ${user.email}`);
    } catch (emailErr) {
      console.error("❌ Failed to send approval email:", emailErr);
    }

    // 6️⃣ Log audit action
    await logAction({
      action: "BOOKING_APPROVED",
      entityType: "Booking",
      entityId: booking._id,
      performedBy: req.user?.email || "Admin",
      details: { status: "approved" },
    });

    // 7️⃣ Respond to client
    res.json({ message: "Booking approved successfully", booking });
  } catch (error) {
    console.error("Error approving booking:", error);
    res.status(500).json({ message: "Server error approving booking" });
  }
};


// 🟠 Reject booking
export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const user = await User.findById(booking.userId);
    const guestHouse = await GuestHouse.findById(booking.guestHouseId);

    // Update status
    booking.status = "rejected";
    await booking.save();

    // Send rejection email
    try {
      await sendEmail({
        to: user.email,
        subject: "❌ Booking Rejected",
        html: bookingStatusUpdate(user, booking, guestHouse, "rejected"),
      });
      console.log(`📧 Rejection email sent to ${user.email}`);
    } catch (emailErr) {
      console.error("❌ Failed to send rejection email:", emailErr);
    }

    await logAction({
      action: "BOOKING_REJECTED",
      entityType: "Booking",
      entityId: booking._id,
      performedBy: req.user?.email || "Admin",
      details: { status: "rejected" },
    });

    res.json({ message: "Booking rejected successfully", booking });
  } catch (error) {
    console.error("Error rejecting booking:", error);
    res.status(500).json({ message: "Server error rejecting booking" });
  }
};



// 🟢 Check Room & Bed Availability for selected Guest House and Date Range
export const checkAvailability = async (req, res) => {
  try {
    const { guestHouseId, checkIn, checkOut } = req.query;

    if (!guestHouseId || !checkIn || !checkOut) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the GuestHouse to get both _id (ObjectId) and guestHouseId (Number)
    const guestHouse = await GuestHouse.findOne({
      $or: [
        { _id: guestHouseId },
        { guestHouseId: parseInt(guestHouseId, 10) }
      ]
    });

    if (!guestHouse) {
      return res.status(404).json({ message: "Guest house not found" });
    }

    // Find all APPROVED bookings overlapping the requested date range
    // Use guestHouse._id since Booking.guestHouseId is ObjectId
    const overlappingBookings = await Booking.find({
      guestHouseId: guestHouse._id,
      status: "approved",
      $or: [
        {
          checkIn: { $lte: new Date(checkOut) },
          checkOut: { $gte: new Date(checkIn) },
        },
      ],
    })
      .populate("roomId", "roomNumber")
      .populate("bedId", "bedNumber bedType");

    // Extract unavailable bed IDs (beds that are booked)
    const unavailableBeds = [
      ...new Set(overlappingBookings.map(b => b.bedId?._id.toString())),
    ];

    // Get all rooms for this guest house (using guestHouseId as Number)
    const rooms = await Room.find({ 
      guestHouseId: guestHouse.guestHouseId, 
      isActive: true 
    });

    // For each room, check if ALL beds are booked
    const unavailableRooms = [];
    
    for (const room of rooms) {
      // Get all active beds for this room
      const totalBeds = await Bed.countDocuments({ 
        roomId: room._id, 
        isActive: true 
      });

      if (totalBeds === 0) {
        // No beds in room, skip it
        continue;
      }

      // Count how many beds in this room are booked for the date range
      const bookedBedsInRoom = overlappingBookings.filter(
        booking => booking.roomId?._id.toString() === room._id.toString()
      );

      // Get unique booked bed IDs for this room
      const bookedBedIds = new Set(
        bookedBedsInRoom.map(b => b.bedId?._id.toString())
      );

      // Room is unavailable only if ALL beds are booked
      if (bookedBedIds.size >= totalBeds) {
        unavailableRooms.push(room._id.toString());
      }
    }

    res.json({ unavailableRooms, unavailableBeds });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ message: "Server error while checking availability" });
  }
};

// 🟢 Get approved bookings for calendar (admin)
export const getApprovedBookingsForCalendar = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "approved" })
      .populate("userId", "firstName lastName email")
      .populate("guestHouseId", "guestHouseName")
      .populate("roomId", "roomNumber")
      .populate("bedId", "bedNumber bedType")
      .sort({ checkIn: 1 }); // Sort by check-in date

    res.json({ bookings });
  } catch (error) {
    console.error("Error fetching approved bookings for calendar:", error);
    res.status(500).json({ message: "Server error fetching calendar bookings" });
  }
};