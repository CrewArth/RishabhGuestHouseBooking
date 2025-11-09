import User from "../models/User.js";

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updateUser = await User.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

    if (!updateUser) {
      return res.status(404).json({ message: "User not Found!" });
    }

    console.log("Updated user:", updateUser);
    res.json({ user: updateUser });
  } catch (error) {
    console.error("Update User Error: ", error);
    res.status(500).json({ message: "Server not Available while updating user." });
  }
}

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};