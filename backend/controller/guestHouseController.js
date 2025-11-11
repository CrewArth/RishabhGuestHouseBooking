import GuestHouse from '../models/GuestHouse.js';
import Room from '../models/Room.js';
import Bed from '../models/Bed.js';
import { logAction } from '../utils/auditLogger.js';


export const createGuestHouse = async (req, res) => {
  try {
    const { guestHouseName, description } = req.body;

    // Parse location string back to JSON
    const location = JSON.parse(req.body.location);

    if (!guestHouseName || !location?.city || !location?.state) {
      return res.status(400).json({ message: "Required Fields Missing" });
    }

    const imageUrl = req.file ? req.file.location : null;

    const guestHouse = await GuestHouse.create({
      guestHouseName,
      location,
      description,
      image: imageUrl,
    });

    // ✅ Guest House Created
    await logAction({
      action: 'GUESTHOUSE_CREATED',
      entityType: 'GuestHouse',
      entityId: guestHouse.guestHouseId,
      performedBy: req.user?.email || 'Admin',
      details: {
        guestHouseName: guestHouse.guestHouseName,
        location: guestHouse.location,
      },
    });

    res.status(201).json({
      message: "Guest House Created Successfully",
      guestHouse,
    });


  } catch (error) {
    console.error("Error creating GuestHouse ", error);
    res.status(500).json({ message: error?.message || "Error creating guest house" });
  }
};

// Get all the Guest Houses
export const getGuestHouses = async (req, res) => {
  try {
    const guestHouses = await GuestHouse.find().sort({createdAt: -1});
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

    // ✅ Maintenance Status Toggled
    await logAction({
      action: 'MAINTENANCE_TOGGLED',
      entityType: 'GuestHouse',
      entityId: guestHouse.guestHouseId,
      performedBy: req.user?.email || 'Admin',
      details: {
        previousStatus: guestHouse.maintenance,
        newStatus: !guestHouse.maintenance,
      },
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
    // 1️⃣ Validate Guest House
    const guestHouse = await GuestHouse.findOne({ guestHouseId });
    if (!guestHouse) {
      return res.status(404).json({ error: "Guest House not found" });
    }

    // 2️⃣ Delete image from AWS S3 (if exists)
    if (guestHouse.image) {
      try {
        const key = guestHouse.image.split('.amazonaws.com/')[1]; // Extract file key
        if (key) {
          const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
          };

          await s3.deleteObject(params).promise();
          console.log(`🗑️ Deleted image from S3: ${key}`);
        }
      } catch (s3Error) {
        console.warn("⚠️ Failed to delete image from S3:", s3Error.message);
      }
    }

    // 3️⃣ Get all rooms under guest house
    const rooms = await Room.find({ guestHouseId });

    // 4️⃣ Delete all beds under those rooms
    const roomIds = rooms.map((room) => room._id);
    await Bed.deleteMany({ roomId: { $in: roomIds } });

    // 5️⃣ Delete all rooms
    await Room.deleteMany({ guestHouseId });

    // 6️⃣ Delete the guest house itself
    await GuestHouse.deleteOne({ guestHouseId });

    // 7️⃣ Log action (safe wrapped)
    try {
      await logAction({
        action: 'GUESTHOUSE_DELETED',
        entityType: 'GuestHouse',
        entityId: guestHouseId,
        performedBy: req.user?.email || 'Admin',
        details: {
          message: 'Guest house deleted permanently, including image on S3',
        },
      });
    } catch (logError) {
      console.warn("Audit log error (continued):", logError.message);
    }

    return res.json({
      success: true,
      message:
        "Guest House, image, and associated Rooms & Beds deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting guest house:", error);
    res.status(500).json({ error: "Server error while deleting Guest House" });
  }
};


export const updateGuestHouse = async (req, res) => {
  try {
    const { guestHouseId } = req.params;

    // Parse location if exists
    let location = {};
    if (req.body.location) {
      try {
        location = JSON.parse(req.body.location);
      } catch {
        location = req.body.location;
      }
    }

    // Construct update object
    const updateData = {
      guestHouseName: req.body.guestHouseName,
      description: req.body.description,
      location,
    };

    if (req.file) {
      updateData.image = req.file.location; // S3 or multer-s3 file path
    }

    // Update guest house
    const updatedGuestHouse = await GuestHouse.findOneAndUpdate(
      { guestHouseId: parseInt(guestHouseId, 10) },
      updateData,
      { new: true }
    );

    if (!updatedGuestHouse) {
      return res.status(404).json({ message: "Guest House not found" });
    }

    // ✅ Log update
    await logAction({
      action: 'GUESTHOUSE_UPDATED',
      entityType: 'GuestHouse',
      entityId: updatedGuestHouse.guestHouseId,
      performedBy: req.user?.email || 'Admin',
      details: updateData,
    });

    res.status(200).json({
      message: "Guest House updated successfully",
      guestHouse: updatedGuestHouse,
    });
  } catch (error) {
    console.error("Error updating Guest House:", error);
    res.status(500).json({ message: "Server error while updating Guest House" });
  }
};
