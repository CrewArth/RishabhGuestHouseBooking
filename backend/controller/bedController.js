import Bed from '../models/Bed.js';
import Room from '../models/Room.js';
import { logAction } from '../utils/auditLogger.js';

//Create a new Bed
export const createBed = async (req, res) => {
  try {
    const { roomId, bedNumber, bedType } = req.body;

    // Check if Room Exists
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room Not Found!" });

    // count active beds for this room
    const activeBedsCount = await Bed.countDocuments({ roomId, isActive: true });

    if (activeBedsCount >= room.roomCapacity) {
      return res.status(400).json({ error: `Room capacity exceeded. Max capacity is ${room.roomCapacity}` });
    }

    // Ensure bedNumber uniqueness per room
    const existingBed = await Bed.findOne({ roomId, bedNumber, isActive: true });
    if (existingBed) {
      return res.status(400).json({ error: "Bed Number already exists in this room" });
    }

    // Create new bed
    const bed = await Bed.create({ roomId, bedNumber, bedType: bedType || 'single' });

    // ✅ Bed Created
    await logAction({
      action: 'BED_CREATED',
      entityType: 'Bed',
      entityId: bed._id,
      performedBy: req.user?.email || 'Admin',
      details: {
        roomId: bed.roomId,
        bedNumber: bed.bedNumber,
        bedType: bed.bedType,
      },
    });




    // Fetch all beds for the room and return
    const beds = await Bed.find({ roomId, isActive: true });

    return res.status(201).json({
      success: true,
      message: "Bed created successfully",
      beds,
    });

  } catch (error) {
    console.error('Error creating bed: ', error);
    res.status(500).json({ error: "Server error while creating bed" });
  }
};

// List beds by roomId
export const listBedsByRoom = async (req, res) => {
  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    // FIX: include isActive filter
    const beds = await Bed.find({ roomId, isActive: true });

    return res.json({ success: true, beds });

  } catch (error) {
    console.error('Error fetching beds: ', error);
    return res.status(500).json({ error: "Server error while fetching beds" });
  }
};


// Update bed details
export const updateBed = async (req, res) => {
  try {
    const updatedBed = await Bed.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedBed) return res.status(404).json({ error: 'Bed not found' });

    await logAction({
      action: 'BED_UPDATED',
      entityType: 'Bed',
      entityId: updatedBed._id,   // FIXED
      performedBy: req.user?.email || 'Admin',
      details: { updatedFields: req.body },
    });

    const beds = await Bed.find({ roomId: updatedBed.roomId, isActive: true });

    return res.json({
      success: true,
      message: 'Bed updated successfully',
      beds,
    });

  } catch (error) {
    console.error("Error updating bed: ", error);
    return res.status(500).json({ error: "Server error while updating beds" });
  }
};



// Toggle Bed Availability
export const toggleAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'isAvailable must be boolean' });
    }

    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      { $set: { isAvailable } },
      { new: true }
    );

    // ✅ Bed Availability Toggled
    await logAction({
      action: 'BED_AVAILABILITY_TOGGLED',
      entityType: 'Bed',
      entityId: bed._id,
      performedBy: req.user?.email || 'Admin',
      details: {
        previousStatus: bed.isAvailable,
        newStatus: !bed.isAvailable,
      },
    });


    if (!bed) return res.status(404).json({ error: 'Bed not found' });

    res.json({ success: true, message: 'Availability updated', bed });

  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({ error: 'Server error while toggling availability' });
  }
};


// Soft Delete bed
export const softDeleteBed = async (req, res) => {
  try {
    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!bed) return res.status(404).json({ error: 'Bed not found' });

    await logAction({
      action: 'BED_DELETED',
      entityType: 'Bed',
      entityId: bed._id,   // FIXED
      performedBy: req.user?.email || 'Admin',
      details: {
        message: 'Bed archived (soft deleted)',
        bedId: bed._id.toString(),
      },
    });

    const beds = await Bed.find({ roomId: bed.roomId, isActive: true });

    return res.json({
      success: true,
      message: 'Bed archived',
      beds,
    });

  } catch (error) {
    console.error('Error deleting bed', error);
    return res.status(500).json({ error: 'Server error while deleting bed' });
  }
};