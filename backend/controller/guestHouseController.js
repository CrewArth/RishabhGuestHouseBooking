import GuestHouse from '../models/GuestHouse.js';
import Room from '../models/Room.js';
import Bed from '../models/Bed.js';
import logAction from '../models/AuditLog.js';

export const createGuestHouse = async (req, res) => {
  try {
    const { guestHouseName, location, image, description } = req.body;

    if (!guestHouseName || !location.city || !location?.state) {
      return res.status(400).json({ message: "Required Fields Missing" });
    }

    const existing = await GuestHouse.findOne({ guestHouseName });

    if (existing) {
      return res.status(400).json({ message: "Guest House Name Already Exists" })
    }

    const guestHouse = await GuestHouse.create({
      guestHouseName,
      location,
      image,
      description
    })

    // After successfully creating a new guest house
    await logAction({
      action: 'GUESTHOUSE_CREATED',
      entityType: 'GuestHouse',
      entityId: guestHouse._id || guestHouse.guestHouseId,
      performedBy: 'Admin',
      details: {
        guestHouseName: guestHouse.guestHouseName,
        location: guestHouse.location,
      }
    });

    return res.status(201).json({
      message: "Guest House Created Sucessfully", guestHouse
    })
  } catch (error) {
    console.error("Error creating GuestHouse ", error);
    res.status(500).json({ message: "Error creating guest house" });
  }
}

// Get all the Guest Houses
export const getGuestHouses = async (req, res) => {
  try {
    const guestHouses = await GuestHouse.find();
    res.status(200).json(guestHouses);
  } catch (error) {
    console.error("Error fetching guest houses")
    res.status(500).json({ message: "Server error" })
  }
}

// Toggle Maintenance Mode
export const toggleMaintenanceMode = async (req, res) => {
  try {
    const { guestHouseId } = req.params;

    const guestHouse = await GuestHouse.findOne({ guestHouseId });

    if (!guestHouse) {
      return res.status(404).json({ message: 'Guest house not found' });
    }

    // Toggle the maintenance flag
    guestHouse.maintenance = !guestHouse.maintenance;
    await guestHouse.save();

    await logAction({
      action: 'MAINTENANCE_TOGGLED',
      entityType: 'GuestHouse',
      entityId: guestHouse._id || guestHouse.guestHouseId,
      performedBy: 'Admin',
      details: {
        maintenance: guestHouse.maintenance,
      }
    });

    res.json({
      message: `Maintenance mode ${guestHouse.maintenance ? 'activated' : 'deactivated'}`,
      guestHouse,
    });
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    res.status(500).json({ message: 'Server error while toggling maintenance mode' });
  }
};

export const deleteGuestHouse = async (req, res) => {
  const guestHouseId = parseInt(req.params.guestHouseId, 10);

  try {
    // 1. Validate Guest House
    const guestHouse = await GuestHouse.findOne({ guestHouseId });
    if (!guestHouse) {
      return res.status(404).json({ error: "Guest House not found" });
    }

    // 2. Get all rooms under guest house
    const rooms = await Room.find({ guestHouseId });

    // 3. Delete all beds under those rooms
    const roomIds = rooms.map((room) => room._id);
    await Bed.deleteMany({ roomId: { $in: roomIds } });

    // 4. Delete all rooms under guest house
    await Room.deleteMany({ guestHouseId });

    // 5. Delete the guest house itself
    await GuestHouse.deleteOne({ guestHouseId });

    // 6. Log Deletion (optional, wrapped safely)
    try {
      await logAction({
        action: "GUESTHOUSE_DELETED",
        entityType: "GuestHouse",
        entityId: guestHouse._id || guestHouse.guestHouseId,
        performedBy: req.user?._id || "System",
        details: { deletedRooms: rooms.length }
      });
    } catch (logError) {
      console.warn("Audit log error (continued without breaking):", logError.message);
    }


    return res.json({
      success: true,
      message: "Guest House and associated Rooms & Beds deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting guest house:", error);
    res.status(500).json({ error: "Server error while deleting Guest House" });
  }
};