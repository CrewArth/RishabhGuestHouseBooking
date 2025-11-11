// controllers/bookingController.js
import Booking from "../models/Booking.js";
import Bed from "../models/Bed.js";
import { logAction } from "../utils/auditLogger.js";
import { sendEmail } from '../utils/emailService.js';
import User from '../models/User.js';
import GuestHouse from '../models/GuestHouse.js';


// 🟢 Create a new booking (user)
export const createBooking = async (req, res) => {
  try {
    const { guestHouseId, roomId, bedId, checkIn, checkOut } = req.body;
    const userId = req.user?._id || req.body.userId;
    
    // ✅ Fetch User & Admin Emails
    const user = await User.findById(userId);
    const adminEmail = process.env.ADMIN_EMAIL || "arthvala7@gmail.com";
    const guestHouse = await GuestHouse.findById(req.body.guestHouseId);

    if (!guestHouseId || !roomId || !bedId || !checkIn || !checkOut) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if bed is already booked for overlapping dates
    const overlap = await Booking.findOne({
      bedId,
      status: "approved",
      $or: [
        { checkIn: { $lte: new Date(checkOut) }, checkOut: { $gte: new Date(checkIn) } },
      ],
    });

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

    // 📨 Send confirmation to user
    await sendEmail({
      to: user.email,
      subject: "📅 Booking Request Submitted",
      html: `
    <h2>Hi ${user.firstName},</h2>
    <p>Your booking request has been received successfully.</p>
    <p>
      <b>Guest House:</b> ${guestHouse?.guestHouseName || "Unknown Guest House"}<br/>
      <b>Check-in:</b> ${new Date(req.body.checkIn).toLocaleDateString()}<br/>
      <b>Check-out:</b> ${new Date(req.body.checkOut).toLocaleDateString()}
    </p>
    <p>We’ll notify you once the admin approves or rejects your request.</p>
    <p>Thanks & Regards<br/>Rishabh GuestHouse</p>
  `,
    });

    // 📨 Notify admin
    await sendEmail({
      to: adminEmail,
      subject: "🆕 New Booking Request Received",
      html: `
    <h2>New Booking Alert!</h2>
    <p><b>User:</b> ${user.firstName} ${user.lastName} (${user.email})</p>
    <p><b>Guest House:</b> ${guestHouse?.guestHouseName || "Unknown"}</p>
    <p><b>Check-in:</b> ${new Date(req.body.checkIn).toLocaleDateString()}</p>
    <p><b>Check-out:</b> ${new Date(req.body.checkOut).toLocaleDateString()}</p>
    <p>Login to the admin panel to review and approve this booking.</p>
  `,
    });

    await logAction({
      action: "BOOKING_CREATED",
      entityType: "Booking",
      entityId: newBooking._id,
      performedBy: req.user?.email || "User",
      details: { guestHouseId, roomId, bedId, checkIn, checkOut },
    });

    res.status(201).json({ message: "Booking request submitted", newBooking });

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
    const adminEmail = process.env.ADMIN_EMAIL || "admin@guesthouse.com";

    // 3️⃣ Update booking status
    booking.status = "approved";
    await booking.save();

    // 4️⃣ Mark bed as unavailable
    await Bed.findByIdAndUpdate(booking.bedId, { isAvailable: false });

    // 5️⃣ Send approval email to user
    await sendEmail({
      to: user.email,
      subject: "✅ Booking Approved",
      html: `
        <h2>Hi ${user.firstName},</h2>
        <p>Good news! Your booking has been <b>approved</b>.</p>
        <p>
          <b>Guest House:</b> ${guestHouse?.guestHouseName || "Unknown Guest House"}<br/>
          <b>Check-in:</b> ${new Date(booking.checkIn).toLocaleDateString()}<br/>
          <b>Check-out:</b> ${new Date(booking.checkOut).toLocaleDateString()}
        </p>
        <p>Your room and bed are now reserved. We look forward to hosting you!</p>
        <br/>
        <p>Thank you,<br/><b>Rishabh GuestHouse Team</b></p>
      `,
    });

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

    booking.status = "rejected";
    await booking.save();

    await sendEmail({
      to: user.email,
      subject: "❌ Booking Rejected",
      html: `
        <h2>Hi ${user.firstName},</h2>
        <p>We’re sorry to inform you that your booking request has been <b>rejected</b>.</p>
        <p>
          <b>Guest House:</b> ${guestHouse?.guestHouseName || "Unknown Guest House"}<br/>
          <b>Check-in:</b> ${new Date(booking.checkIn).toLocaleDateString()}<br/>
          <b>Check-out:</b> ${new Date(booking.checkOut).toLocaleDateString()}
        </p>
        <p>This could be due to unavailability or overlapping reservations. You can try booking another room or date range.</p>
        <br/>
        <p>Thank you,<br/><b>Rishabh GuestHouse Team</b></p>
      `,
    });

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

    // Find all APPROVED bookings overlapping the requested date range
    const overlappingBookings = await Booking.find({
      guestHouseId,
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

    // Extract unavailable room & bed IDs
    const unavailableRooms = [
      ...new Set(overlappingBookings.map(b => b.roomId?._id.toString())),
    ];

    const unavailableBeds = [
      ...new Set(overlappingBookings.map(b => b.bedId?._id.toString())),
    ];

    res.json({ unavailableRooms, unavailableBeds });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ message: "Server error while checking availability" });
  }
};
