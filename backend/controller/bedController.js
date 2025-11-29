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

// Auto-create beds based on room capacity
export const autoCreateBeds = async (req, res) => {
  try {
    const { roomId, bedType = 'single' } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required' });
    }

    // Check if Room Exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Get existing active beds for this room
    const existingBeds = await Bed.find({ roomId, isActive: true }).sort({ bedNumber: 1 });
    const existingBedsCount = existingBeds.length;

    // Check if room is already at capacity
    if (existingBedsCount >= room.roomCapacity) {
      return res.status(400).json({ 
        error: `Room is already at full capacity (${room.roomCapacity} beds). Cannot create more beds.` 
      });
    }

    // Calculate how many beds need to be created
    const bedsToCreate = room.roomCapacity - existingBedsCount;

    // Find the next available bed number
    let nextBedNumber = 1;
    if (existingBeds.length > 0) {
      // Get the highest bed number and increment
      const maxBedNumber = Math.max(...existingBeds.map(b => b.bedNumber));
      nextBedNumber = maxBedNumber + 1;
    }

    // Create beds array
    const bedsToInsert = [];
    for (let i = 0; i < bedsToCreate; i++) {
      bedsToInsert.push({
        roomId,
        bedNumber: nextBedNumber + i,
        bedType,
        isAvailable: true,
        isActive: true,
      });
    }

    // Insert all beds
    const createdBeds = await Bed.insertMany(bedsToInsert);

    // Log action for each bed created
    for (const bed of createdBeds) {
      await logAction({
        action: 'BED_CREATED',
        entityType: 'Bed',
        entityId: bed._id,
        performedBy: req.user?.email || 'Admin',
        details: {
          roomId: bed.roomId,
          bedNumber: bed.bedNumber,
          bedType: bed.bedType,
          autoCreated: true,
        },
      });
    }

    // Fetch all beds for the room and return
    const allBeds = await Bed.find({ roomId, isActive: true }).sort({ bedNumber: 1 });

    return res.status(201).json({
      success: true,
      message: `Successfully created ${bedsToCreate} bed(s)`,
      createdCount: bedsToCreate,
      beds: allBeds,
    });

  } catch (error) {
    console.error('Error auto-creating beds:', error);
    
    // Handle duplicate key error (bed number conflict)
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Bed number conflict. Some beds may have been created. Please refresh and try again.' 
      });
    }

    return res.status(500).json({ error: 'Server error while auto-creating beds' });
  }
};