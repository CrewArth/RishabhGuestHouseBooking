// utils/auditLogger.js
import AuditLog from "../models/AuditLog.js";
import GuestHouse from "../models/GuestHouse.js";
import Room from "../models/Room.js";
import Bed from "../models/Bed.js";
import User from "../models/User.js";
import Booking from '../models/Booking.js';

export const logAction = async ({ action, entityType, entityId, performedBy = "System", details = {} }) => {
  try {
    let enriched = { ...details };

    // ========= ENRICHMENT BASED ON ENTITY TYPE =========
    if (entityType === "GuestHouse") {
      const gh = await GuestHouse.findOne({ guestHouseId: entityId });
      if (gh) {
        enriched.guestHouseName = gh.guestHouseName;
        enriched.location = gh.location;
      }
    }

    if (entityType === "Room") {
      const room = await Room.findById(entityId);
      if (room) {
        const gh = await GuestHouse.findOne({ guestHouseId: room.guestHouseId });
        enriched.roomNumber = room.roomNumber;
        enriched.roomType = room.roomType;
        enriched.guestHouseName = gh?.guestHouseName;
      }
    }

    if (entityType === "Bed") {
      const bed = await Bed.findById(entityId).populate("roomId");
      if (bed) {
        const gh = await GuestHouse.findOne({ guestHouseId: bed.roomId.guestHouseId });
        enriched.bedNumber = bed.bedNumber;
        enriched.bedType = bed.bedType;
        enriched.roomNumber = bed.roomId.roomNumber;
        enriched.guestHouseName = gh?.guestHouseName;
      }
    }

    if (entityType === "Booking") {
      const bk = await Booking.findById(entityId)
        .populate("guestHouseId")
        .populate("roomId")
        .populate("bedId")
        .populate("userId");

      if (bk) {
        enriched = {
          user: {
            name: `${bk.userId.firstName} ${bk.userId.lastName}`,
            email: bk.userId.email,
            phone: bk.userId.phone,
          },
          guestHouse: bk.guestHouseId.guestHouseName,
          room: bk.roomId?.roomNumber,
          bed: `${bk.bedId?.bedNumber} (${bk.bedId?.bedType})`,
          checkIn: bk.checkIn,
          checkOut: bk.checkOut,
          status: bk.status
        };
      }
    }

    if (entityType === "User") {
      const user = await User.findById(entityId);
      if (user) {
        enriched.userDetails = {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive
        };
      }
    }

    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy,
      details: enriched
    });
  } catch (err) {
    console.error("Audit Log Error →", err);
  }
};
