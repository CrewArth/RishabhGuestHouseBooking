import User from "../models/User.js";
import { logAction } from "../utils/auditLogger.js";

const getTrackedDetails = (payload = {}) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "role",
    "isActive",
  ];

  return allowedFields.reduce((acc, field) => {
    if (payload[field] !== undefined) {
      acc[field] = payload[field];
    }
    return acc;
  }, {});
};

const performer = (req) => req.user?.email || "Admin";

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not Found!" });
    }

    await logAction({
      action: "USER_UPDATED",
      entityType: "User",
      entityId: updatedUser._id,
      performedBy: performer(req),
      details: getTrackedDetails(updatedData),
    });

    console.log("Updated user:", updatedUser);
    res.json({ user: updatedUser });
  } catch (error) {
    console.error("Update User Error: ", error);
    res
      .status(500)
      .json({ message: "Server not Available while updating user." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    await logAction({
      action: "USER_DELETED",
      entityType: "User",
      entityId: deleted._id,
      performedBy: performer(req),
      details: {
        email: deleted.email,
        name: `${deleted.firstName} ${deleted.lastName}`.trim(),
      },
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    await logAction({
      action: "USER_DEACTIVATED",
      entityType: "User",
      entityId: user._id,
      performedBy: performer(req),
      details: { isActive: user.isActive },
    });

    res.json({ message: "User deactivated successfully", user });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    await logAction({
      action: user.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entityType: "User",
      entityId: user._id,
      performedBy: performer(req),
      details: { isActive: user.isActive },
    });

    res.json({
      message: user.isActive ? "User activated" : "User deactivated",
      user,
    });
  } catch (error) {
    console.error("Error toggling user:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};