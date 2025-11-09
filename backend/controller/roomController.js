import Room from '../models/Room.js';
import GuestHouse from '../models/GuestHouse.js';
import { createRoomSchema, updateRoomSchema, listRoomsQuerySchema } from '../validators/room.schema.js';
import { logAction } from '../utils/auditLogger.js';

// Helper: consistent error payload
const sendError = (res, status, message, details) =>
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });


// Create Room 
// POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const { error, value } = createRoomSchema.validate(req.body, { abortEarly: false });
    if (error) return sendError(res, 400, 'Validation failed', error.details);

    const { guestHouseId, roomNumber, roomType, roomCapacity, isAvailable } = value;

    // Ensure GuestHouse exists
    const gh = await GuestHouse.findOne({ guestHouseId });
    if (!gh) return sendError(res, 404, `Guest House ${guestHouseId} not found`);


    // Create room (unique index will enforce duplicates)
    const room = await Room.create({
      guestHouseId,
      roomNumber,
      roomType,
      roomCapacity,
      isAvailable
    });

    // ✅ Room Created
    await logAction({
      action: 'ROOM_CREATED',
      entityType: 'Room',
      entityId: room._id,
      performedBy: req.user?.email || 'Admin',
      details: {
        guestHouseId: room.guestHouseId,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
      },
    });

    return res.status(201).json({ success: true, message: 'Room created', room });
  } catch (err) {
    // Handle duplicate key error nicely
    if (err?.code === 11000) {
      return sendError(res, 409, 'Room already exists for this guest house (duplicate roomNumber).');
    }
    console.error('createRoom error:', err);
    return sendError(res, 500, 'Server error');
  }
};

// GET /api/rooms
export const listRooms = async (req, res) => {
  try {
    const { error, value } = listRoomsQuerySchema.validate(req.query, { abortEarly: false });
    if (error) return sendError(res, 400, 'Invalid query', error.details);

    const { guestHouseId, roomType, isAvailable, isActive, page, limit, sort, order } = value;

    const filter = {};
    if (guestHouseId !== undefined) filter.guestHouseId = guestHouseId;
    if (roomType !== undefined) filter.roomType = roomType;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable;
    if (isActive !== undefined) filter.isActive = isActive;
    else filter.isActive = true; // default: active only

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Room.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit),
      Room.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items
    });
  } catch (err) {
    console.error('listRooms error:', err);
    return sendError(res, 500, 'Server error');
  }
};

// GET /api/rooms/:id  (Mongo _id, not guestHouseId)
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || !room.isActive) return sendError(res, 404, 'Room not found');
    return res.json({ success: true, room });
  } catch (err) {
    console.error('getRoomById error:', err);
    return sendError(res, 500, 'Server error');
  }
};

// PUT /api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const { error, value } = updateRoomSchema.validate(req.body, { abortEarly: false });
    if (error) return sendError(res, 400, 'Validation failed', error.details);

    // Prevent moving a room across guest houses via this endpoint (optional guard)
    if (Object.prototype.hasOwnProperty.call(value, 'guestHouseId')) {
      return sendError(res, 400, 'guestHouseId cannot be updated via this endpoint');
    }

    // If roomNumber is changed, the unique index still protects constraints.
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );

    // ✅ Room Updated
    await logAction({
      action: 'ROOM_UPDATED',
      entityType: 'Room',
      entityId: room._id,
      performedBy: req.user?.email || 'Admin',
      details: {
        updatedFields: req.body,
      },
    });
    if (!room) return sendError(res, 404, 'Room not found');
    return res.json({ success: true, message: 'Room updated', room });
  } catch (err) {
    if (err?.code === 11000) {
      return sendError(res, 409, 'Room number already exists for this guest house.');
    }
    console.error('updateRoom error:', err);
    return sendError(res, 500, 'Server error');
  }
};

// PATCH /api/rooms/:id/availability
export const setAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return sendError(res, 400, 'isAvailable must be boolean');
    }
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: { isAvailable } },
      { new: true }
    );

    // ✅ Room Availability Toggled
    await logAction({
      action: 'ROOM_AVAILABILITY_TOGGLED',
      entityType: 'Room',
      entityId: room._id,
      performedBy: req.user?.email || 'Admin',
      details: {
        previousStatus: room.isAvailable,
        newStatus: !room.isAvailable,
      },
    });
    if (!room) return sendError(res, 404, 'Room not found');
    return res.json({ success: true, message: 'Availability updated', room });
  } catch (err) {
    console.error('setAvailability error:', err);
    return sendError(res, 500, 'Server error');
  }
};

// DELETE /api/rooms/:id (soft delete)
export const softDeleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    // ✅ Room Deleted
    await logAction({
      action: 'ROOM_DELETED',
      entityType: 'Room',
      entityId: roomId,
      performedBy: req.user?.email || 'Admin',
      details: {
        message: 'Room deleted successfully',
      },
    });
    if (!room) return sendError(res, 404, 'Room not found');
    return res.json({ success: true, message: 'Room archived', room });
  } catch (err) {
    console.error('softDeleteRoom error:', err);
    return sendError(res, 500, 'Server error');
  }
};

// Fetch rooms by guestHouseId
export const getRoomsByGuestHouse = async (req, res) => {
  try {
    const guestHouseId = parseInt(req.query.guestHouseId, 10);

    if (!guestHouseId) {
      return res.status(400).json({ error: "guestHouseId is required" });
    }

    const rooms = await Room.find({ guestHouseId });
    res.json({ success: true, rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Server error while fetching rooms" });
  }
};
