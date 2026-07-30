// controllers/bookingController.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Bed from "../models/Bed.js";
import Room from "../models/Room.js";
import { logAction } from "../utils/auditLogger.js";
import { sendEmail } from '../utils/emailService.js';
import User from '../models/User.js';
import GuestHouse from '../models/GuestHouse.js';
import { bookingRequest } from "../utils/emailTemplates/bookingRequest.js";
import { bookingStatusUpdate } from "../utils/emailTemplates/bookingStatusUpdate.js";

const parseFamilyMembers = (familyMembers) => {
  if (!familyMembers) {
    return [];
  }

  const parsedFamilyMembers = typeof familyMembers === "string"
    ? JSON.parse(familyMembers)
    : familyMembers;

  if (!Array.isArray(parsedFamilyMembers)) {
    throw new Error("Family details must be a list");
  }

  return parsedFamilyMembers
    .filter((member) => member?.name || member?.relation || member?.age)
    .map((member) => ({
      name: String(member.name || "").trim(),
      relation: String(member.relation || "").trim(),
      age: member.age === "" || member.age == null ? undefined : Number(member.age),
    }));
};

const parseRoomIds = (body) => {
  const rawIds = body.roomIds ?? body['roomIds[]'];
  let ids = Array.isArray(rawIds) ? rawIds : rawIds;

  if (typeof ids === 'string') {
    try {
      const parsed = JSON.parse(ids);
      ids = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      ids = ids.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  if (Array.isArray(ids) && ids.length > 0) {
    return [...new Set(ids.map(String).filter(Boolean))];
  }
  if (body.roomId) {
    return [String(body.roomId)];
  }
  return [];
};

const getBookingRoomIdStrings = (booking) => {
  if (booking.roomIds?.length) {
    return booking.roomIds.map((room) =>
      (typeof room === "object" && room?._id ? room._id : room).toString()
    );
  }
  if (booking.roomId) {
    const id = typeof booking.roomId === "object" && booking.roomId._id
      ? booking.roomId._id
      : booking.roomId;
    return [id.toString()];
  }
  return [];
};

const formatBookingRoomsLabel = (booking) => {
  const rooms = booking.roomIds?.length
    ? booking.roomIds
    : booking.roomId
      ? [booking.roomId]
      : [];
  return rooms
    .map((room) => (typeof room === "object" && room?.roomNumber ? `Room ${room.roomNumber}` : ""))
    .filter(Boolean)
    .join(", ");
};

const checkRoomAvailability = async ({ roomIds, bedId, checkInDate, checkOutDate, excludeId }) => {
  if (bedId && roomIds.length === 1) {
    const query = {
      bedId,
      status: "approved",
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    };
    if (excludeId) query._id = { $ne: excludeId };
    const overlap = await Booking.findOne(query);
    if (overlap) {
      return { conflict: true, message: "This bed is already booked for the selected dates" };
    }
    return { conflict: false };
  }

  for (const roomId of roomIds) {
    const query = {
      status: "approved",
      bedId: null,
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
      $or: [{ roomId }, { roomIds: roomId }],
    };
    if (excludeId) query._id = { $ne: excludeId };
    const overlap = await Booking.findOne(query);
    if (overlap) {
      return { conflict: true, message: "One or more selected rooms are already booked for the selected dates" };
    }
  }

  return { conflict: false };
};

export const createAdminBooking = async (req, res) => {
  try {
    const {
      guestHouseId,
      bedId,
      checkIn,
      checkOut,
      fullName,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      nationality,
      identityType,
      identityNumber,
      emergencyContactName,
      emergencyContactPhone,
      specialRequests,
    } = req.body;

    const roomIds = parseRoomIds(req.body);

    if (!guestHouseId || roomIds.length === 0 || !checkIn || !checkOut || !fullName || !email || !phone || !address || !identityType || !req.verificationImageUrl) {
      return res.status(400).json({ message: "Booking, guest, identity, and verification image details are required" });
    }

    if (roomIds.length > 1 && bedId) {
      return res.status(400).json({ message: "Bed selection is only available when booking a single room" });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      return res.status(400).json({ message: "Check-out must be after check-in" });
    }

    const familyMembers = parseFamilyMembers(req.body.familyMembers);
    if (familyMembers.some((member) => !member.name || !member.relation || (member.age !== undefined && Number.isNaN(member.age)))) {
      return res.status(400).json({ message: "Each family member needs a name, relation, and valid age" });
    }

    // Attach family member verification image URLs (populated by middleware)
    const familyMemberImageUrls = req.familyMemberImageUrls || {};
    const familyMembersWithImages = familyMembers.map((member, i) => ({
      ...member,
      ...(familyMemberImageUrls[i] ? { verificationImage: familyMemberImageUrls[i] } : {}),
    }));

    const [guestHouse, rooms, bed, overlapResult] = await Promise.all([
      GuestHouse.findOne({ guestHouseId }),
      Room.find({ _id: { $in: roomIds } }),
      bedId ? Bed.findById(bedId) : Promise.resolve(null),
      checkRoomAvailability({ roomIds, bedId, checkInDate, checkOutDate }),
    ]);

    if (!guestHouse) {
      return res.status(404).json({ message: "Selected guest house was not found" });
    }

    if (rooms.length !== roomIds.length) {
      return res.status(404).json({ message: "One or more selected rooms were not found" });
    }

    const invalidRoom = rooms.find((room) => room.guestHouseId !== guestHouse.guestHouseId);
    if (invalidRoom) {
      return res.status(400).json({ message: "All selected rooms must belong to the chosen guest house" });
    }

    if (bedId && !bed) {
      return res.status(404).json({ message: "Selected bed was not found" });
    }

    if (bed && (String(bed.roomId) !== String(roomIds[0]) || rooms[0].guestHouseId !== guestHouse.guestHouseId)) {
      return res.status(400).json({ message: "Selected room and bed do not belong to this guest house" });
    }

    if (overlapResult.conflict) {
      return res.status(409).json({ message: overlapResult.message });
    }

    const primaryRoomId = roomIds[0];

    const booking = await Booking.create({
      guestHouseId,
      roomId: primaryRoomId,
      roomIds,
      bedId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      status: "approved",
      fullName: fullName.trim(),
      email,
      phone,
      address: address.trim(),
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      nationality: nationality?.trim(),
      identityType,
      identityNumber: identityNumber?.trim() || undefined,
      verificationImage: req.verificationImageUrl,
      emergencyContactName: emergencyContactName?.trim(),
      emergencyContactPhone: emergencyContactPhone?.trim(),
      familyMembers: familyMembersWithImages,
      specialRequests: specialRequests?.trim(),
      bookingSource: "admin",
      createdBy: req.user?._id,
    });

    logAction({
      action: "ADMIN_BOOKING_CREATED",
      entityType: "Booking",
      entityId: booking._id,
      performedBy: req.user?.email || "Admin",
      details: { guestHouseId, roomIds, bedId, checkIn, checkOut },
    }).catch((error) => console.error("Audit log error:", error));

    return res.status(201).json({ message: "Room booked successfully", booking });
  } catch (error) {
    console.error("Error creating admin booking:", error);
    return res.status(500).json({ message: error.message || "Server error creating booking" });
  }
};


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
      GuestHouse.findOne({ guestHouseId }),
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
    const { startDate, endDate, guestHouseId } = req.query;
    const query = {};

    if (guestHouseId) {
      const isObjectId = mongoose.Types.ObjectId.isValid(guestHouseId);
      const gh = await GuestHouse.findOne({
        $or: [
          { guestHouseId },
          ...(isObjectId ? [{ _id: guestHouseId }] : [])
        ]
      }).lean();

      const targetId = gh ? gh.guestHouseId : guestHouseId;
      query.$or = [
        { guestHouseId: targetId },
        { guestHouseId: guestHouseId }
      ];
    }

    if (startDate || endDate) {
      // Filter on checkIn/checkOut dates (when the stay is, not when the booking was made)
      // Check for any overlap: booking's checkIn < endDate AND booking's checkOut > startDate
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000Z`);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({ message: "Invalid start date" });
        }
        query.checkOut = { $gt: start };
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999Z`);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid end date" });
        }
        // If we already have a checkOut condition, add checkIn condition
        if (query.checkOut) {
          query.checkIn = { $lt: end };
        } else {
          query.checkIn = { $lt: end };
        }
      }
    }

    // Fetch bookings with populate for userId, roomId, bedId (but not guestHouseId)
    let bookings = await Booking.find(query)
      .populate("userId", "email firstName lastName")
      .populate("roomId", "roomNumber")
      .populate("roomIds", "roomNumber roomType")
      .populate("bedId", "bedNumber bedType")
      .sort({ createdAt: -1 }) // ✅ Sort newest first
      .lean();

    // Manually fetch guest houses and attach to bookings
    const guestHouseIds = [...new Set(bookings.map(b => b.guestHouseId).filter(Boolean))];
    const guestHouses = await GuestHouse.find({ guestHouseId: { $in: guestHouseIds } }).lean();
    const guestHouseMap = {};
    guestHouses.forEach(gh => { guestHouseMap[gh.guestHouseId] = gh; });

    bookings = bookings.map(b => ({
      ...b,
      guestHouseId: guestHouseMap[b.guestHouseId] || b.guestHouseId
    }));

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

    // Fetch bookings with populate for userId, roomId, bedId (but not guestHouseId)
    let bookings = await Booking.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate("userId", "firstName lastName email phone")
      .populate("roomId", "roomNumber")
      .populate("roomIds", "roomNumber roomType")
      .populate("bedId", "bedNumber bedType")
      .sort({ createdAt: -1 })
      .lean();

    // Manually fetch guest houses and attach to bookings
    const guestHouseIds = [...new Set(bookings.map(b => b.guestHouseId).filter(Boolean))];
    const guestHouses = await GuestHouse.find({ guestHouseId: { $in: guestHouseIds } }).lean();
    const guestHouseMap = {};
    guestHouses.forEach(gh => { guestHouseMap[gh.guestHouseId] = gh; });

    bookings = bookings.map(b => ({
      ...b,
      guestHouseId: guestHouseMap[b.guestHouseId] || b.guestHouseId
    }));

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
      escapeValue(formatBookingRoomsLabel(b)),
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
    // Fetch bookings with populate for roomId, bedId (but not guestHouseId)
    let bookings = await Booking.find({ userId })
      .populate("roomId", "roomNumber")
      .populate("roomIds", "roomNumber roomType")
      .populate("bedId", "bedNumber bedType")
      .sort({ createdAt: -1 })
      .lean();

    // Manually fetch guest houses and attach to bookings
    const guestHouseIds = [...new Set(bookings.map(b => b.guestHouseId).filter(Boolean))];
    const guestHouses = await GuestHouse.find({ guestHouseId: { $in: guestHouseIds } }).lean();
    const guestHouseMap = {};
    guestHouses.forEach(gh => { guestHouseMap[gh.guestHouseId] = gh; });

    bookings = bookings.map(b => ({
      ...b,
      guestHouseId: guestHouseMap[b.guestHouseId] || b.guestHouseId
    }));

    res.json({ bookings });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Server error fetching user bookings" });
  }
};

// 🟢 Approve booking (Optimized for performance)
export const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Fetch booking first
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 2️⃣ Parallelize: Fetch user and guest house simultaneously
    const [user, guestHouse] = await Promise.all([
      User.findById(booking.userId),
      GuestHouse.findOne({ guestHouseId: booking.guestHouseId })
    ]);

    if (!user || !guestHouse) {
      return res.status(404).json({ message: "User or Guest House not found" });
    }

    // 3️⃣ Update booking status and bed availability in parallel
    const [updatedBooking] = await Promise.all([
      Booking.findByIdAndUpdate(id, { status: "approved" }, { new: true }),
      Bed.findByIdAndUpdate(booking.bedId, { isAvailable: false })
    ]);

    // 4️⃣ Send response immediately (don't wait for email/audit/cache)
    res.json({ message: "Booking approved successfully", booking: updatedBooking });

    // 5️⃣ Fire-and-forget: Send email asynchronously (non-blocking)
    sendEmail({
      to: user.email,
      subject: "✅ Booking Approved",
      html: bookingStatusUpdate(user, updatedBooking, guestHouse, "approved"),
    }).catch(err => console.error("❌ Failed to send approval email:", err));

    // 6️⃣ Fire-and-forget: Log audit action asynchronously (non-blocking)
    logAction({
      action: "BOOKING_APPROVED",
      entityType: "Booking",
      entityId: updatedBooking._id,
      performedBy: req.user?.email || "Admin",
      details: { status: "approved" },
    }).catch(err => console.error("❌ Audit log error:", err));

  } catch (error) {
    console.error("Error approving booking:", error);
    res.status(500).json({ message: "Server error approving booking" });
  }
};


// 🟠 Reject booking (Optimized for performance)
export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Fetch booking first
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 2️⃣ Parallelize: Fetch user and guest house simultaneously
    const [user, guestHouse] = await Promise.all([
      User.findById(booking.userId),
      GuestHouse.findOne({ guestHouseId: booking.guestHouseId })
    ]);

    if (!user || !guestHouse) {
      return res.status(404).json({ message: "User or Guest House not found" });
    }

    // 3️⃣ Update booking status
    const updatedBooking = await Booking.findByIdAndUpdate(
      id, 
      { status: "rejected" }, 
      { new: true }
    );

    // 4️⃣ Send response immediately (don't wait for email/audit/cache)
    res.json({ message: "Booking rejected successfully", booking: updatedBooking });

    // 5️⃣ Fire-and-forget: Send rejection email asynchronously (non-blocking)
    sendEmail({
      to: user.email,
      subject: "❌ Booking Rejected",
      html: bookingStatusUpdate(user, updatedBooking, guestHouse, "rejected"),
    }).catch(err => console.error("❌ Failed to send rejection email:", err));

    // 6️⃣ Fire-and-forget: Log audit action asynchronously (non-blocking)
    logAction({
      action: "BOOKING_REJECTED",
      entityType: "Booking",
      entityId: updatedBooking._id,
      performedBy: req.user?.email || "Admin",
      details: { status: "rejected" },
    }).catch(err => console.error("❌ Audit log error:", err));

  } catch (error) {
    console.error("Error rejecting booking:", error);
    res.status(500).json({ message: "Server error rejecting booking" });
  }
};



// Check Room & Bed Availability for selected Guest House and Date Range
export const checkAvailability = async (req, res) => {
  try {
    const { guestHouseId, checkIn, checkOut } = req.query;

    if (!guestHouseId || !checkIn || !checkOut) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the GuestHouse using guestHouseId (String like GH001)
    const guestHouse = await GuestHouse.findOne({ guestHouseId });

    if (!guestHouse) {
      return res.status(404).json({ message: "Guest house not found" });
    }

    // Find all APPROVED bookings overlapping the requested date range
    // Use guestHouse.guestHouseId (String) since Booking.guestHouseId is String now
    const overlappingBookings = await Booking.find({
      guestHouseId: guestHouse.guestHouseId,
      status: "approved",
      $or: [
        {
          checkIn: { $lte: new Date(checkOut) },
          checkOut: { $gte: new Date(checkIn) },
        },
      ],
    })
      .populate("roomId", "roomNumber")
      .populate("roomIds", "roomNumber roomType")
      .populate("bedId", "bedNumber bedType");

    // Extract unavailable bed IDs (beds that are booked)
    const unavailableBeds = [
      ...new Set(overlappingBookings.map(b => b.bedId?._id.toString())),
    ];

    // Get all rooms for this guest house (using guestHouseId as String)
    const rooms = await Room.find({ 
      guestHouseId: guestHouse.guestHouseId, 
      isActive: true 
    });

    // For each room, check if it is unavailable:
    // - it has a room-level booking (no bedId) overlapping the range, OR
    // - ALL its beds are booked for the range
    const unavailableRooms = [];
    
    for (const room of rooms) {
      // A room-level booking (bedId is null) blocks the whole room
      const hasRoomLevelBooking = overlappingBookings.some(
        (b) => !b.bedId && getBookingRoomIdStrings(b).includes(room._id.toString())
      );

      if (hasRoomLevelBooking) {
        unavailableRooms.push(room._id.toString());
        continue;
      }

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
        (booking) => booking.bedId && getBookingRoomIdStrings(booking).includes(room._id.toString())
      );

      // Get unique booked bed IDs for this room
      const bookedBedIds = new Set(
        bookedBedsInRoom.map(b => b.bedId?._id.toString()).filter(Boolean)
      );

      // Room is unavailable if ALL beds are booked
      if (bookedBedIds.size >= totalBeds) {
        unavailableRooms.push(room._id.toString());
      }
    }

    const result = { unavailableRooms, unavailableBeds };

    res.json(result);
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ message: "Server error while checking availability" });
  }
};

// 🔴 Cancel booking (admin — marks approved booking as cancelled and frees the bed)
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    const [user, guestHouse] = await Promise.all([
      User.findById(booking.userId),
      GuestHouse.findOne({ guestHouseId: booking.guestHouseId }),
    ]);

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    // Free the bed back up
    await Bed.findByIdAndUpdate(booking.bedId, { isAvailable: true });

    res.json({ message: "Booking cancelled successfully", booking: updatedBooking });

    // Fire-and-forget: email notification
    if (user && guestHouse) {
      sendEmail({
        to: user.email,
        subject: "🚫 Booking Cancelled",
        html: bookingStatusUpdate(user, updatedBooking, guestHouse, "cancelled"),
      }).catch(err => console.error("❌ Failed to send cancellation email:", err));
    }

    // Fire-and-forget: audit log
    logAction({
      action: "BOOKING_CANCELLED",
      entityType: "Booking",
      entityId: updatedBooking._id,
      performedBy: req.user?.email || "Admin",
      details: { status: "cancelled" },
    }).catch(err => console.error("❌ Audit log error:", err));

  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Server error cancelling booking" });
  }
};
export const getApprovedBookingsForCalendar = async (req, res) => {
  try {
    // Scope to assigned guest house for ADMIN role
    const query = { status: { $in: ["approved", "cancelled"] } };
    const user = req.user;
    if (user?.role === 'ADMIN' && user.assignedGuestHouseId) {
      const ghId = typeof user.assignedGuestHouseId === 'object'
        ? user.assignedGuestHouseId.guestHouseId
        : user.assignedGuestHouseId;
      if (ghId) query.guestHouseId = ghId;
    }
    let bookings = await Booking.find(query)
      .populate("userId", "firstName lastName email")
      .populate("roomId", "roomNumber")
      .populate("roomIds", "roomNumber roomType")
      .populate("bedId", "bedNumber bedType")
      .sort({ checkIn: 1 })
      .lean();

    // Manually fetch guest houses and attach to bookings
    const guestHouseIds = [...new Set(bookings.map(b => b.guestHouseId).filter(Boolean))];
    const guestHouses = await GuestHouse.find({ guestHouseId: { $in: guestHouseIds } }).lean();
    const guestHouseMap = {};
    guestHouses.forEach(gh => { guestHouseMap[gh.guestHouseId] = gh; });

    bookings = bookings.map(b => ({
      ...b,
      guestHouseId: guestHouseMap[b.guestHouseId] || b.guestHouseId
    }));

    res.json({ bookings });
  } catch (error) {
    console.error("Error fetching approved bookings for calendar:", error);
    res.status(500).json({ message: "Server error fetching calendar bookings" });
  }
};

// Get a single booking by ID (admin)
export const getBookingById = async (req, res) => {
  try {
    // Fetch booking with populate for roomId, bedId (but not guestHouseId)
    let booking = await Booking.findById(req.params.id)
      .populate("roomId", "roomNumber roomType _id")
      .populate("roomIds", "roomNumber roomType _id")
      .populate("bedId", "bedNumber bedType _id")
      .lean();

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Manually fetch guest house and attach to booking
    const guestHouse = await GuestHouse.findOne({ guestHouseId: booking.guestHouseId }).lean();
    booking.guestHouseId = guestHouse || booking.guestHouseId;

    res.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server error fetching booking" });
  }
};

// Update an existing admin booking (edit)
export const updateAdminBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      guestHouseId, bedId,
      checkIn, checkOut,
      fullName, email, phone, address,
      dateOfBirth, gender, nationality,
      identityType, identityNumber,
      emergencyContactName, emergencyContactPhone,
      specialRequests,
    } = req.body;

    const roomIds = parseRoomIds(req.body);

    if (!guestHouseId || roomIds.length === 0 || !checkIn || !checkOut || !fullName || !email || !phone || !address || !identityType) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (roomIds.length > 1 && bedId) {
      return res.status(400).json({ message: "Bed selection is only available when booking a single room" });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      return res.status(400).json({ message: "Check-out must be after check-in" });
    }

    const [guestHouse, rooms, bed, overlapResult] = await Promise.all([
      GuestHouse.findOne({ guestHouseId }),
      Room.find({ _id: { $in: roomIds } }),
      bedId ? Bed.findById(bedId) : Promise.resolve(null),
      checkRoomAvailability({ roomIds, bedId, checkInDate, checkOutDate, excludeId: id }),
    ]);

    if (!guestHouse) {
      return res.status(404).json({ message: "Selected guest house was not found" });
    }

    if (rooms.length !== roomIds.length) {
      return res.status(404).json({ message: "One or more selected rooms were not found" });
    }

    const invalidRoom = rooms.find((room) => room.guestHouseId !== guestHouse.guestHouseId);
    if (invalidRoom) {
      return res.status(400).json({ message: "All selected rooms must belong to the chosen guest house" });
    }

    if (bedId && !bed) {
      return res.status(404).json({ message: "Selected bed was not found" });
    }

    if (bed && String(bed.roomId) !== String(roomIds[0])) {
      return res.status(400).json({ message: "Selected bed does not belong to the selected room" });
    }

    if (overlapResult.conflict) {
      return res.status(409).json({ message: overlapResult.message });
    }

    const familyMembers = parseFamilyMembers(req.body.familyMembers);
    const familyMemberImageUrls = req.familyMemberImageUrls || {};
    const familyMembersWithImages = familyMembers.map((member, i) => ({
      ...member,
      ...(familyMemberImageUrls[i] ? { verificationImage: familyMemberImageUrls[i] } : {}),
    }));

    const primaryRoomId = roomIds[0];

    const updateData = {
      guestHouseId,
      roomId: primaryRoomId,
      roomIds,
      bedId: bedId || undefined,
      checkIn: checkInDate, checkOut: checkOutDate,
      fullName: fullName.trim(), email, phone, address: address.trim(),
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      nationality: nationality?.trim(),
      identityType,
      identityNumber: identityNumber?.trim() || undefined,
      emergencyContactName: emergencyContactName?.trim(),
      emergencyContactPhone: emergencyContactPhone?.trim(),
      familyMembers: familyMembersWithImages,
      specialRequests: specialRequests?.trim(),
    };

    // Only update verification image if a new one was uploaded
    if (req.verificationImageUrl) {
      updateData.verificationImage = req.verificationImageUrl;
    }

    const updated = await Booking.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Booking not found" });

    logAction({
      action: "ADMIN_BOOKING_UPDATED",
      entityType: "Booking",
      entityId: updated._id,
      performedBy: req.user?.email || "Admin",
      details: { guestHouseId, roomIds, bedId, checkIn, checkOut },
    }).catch((err) => console.error("Audit log error:", err));

    return res.status(200).json({ message: "Booking updated successfully", booking: updated });
  } catch (error) {
    console.error("Error updating admin booking:", error);
    return res.status(500).json({ message: error.message || "Server error updating booking" });
  }
};
