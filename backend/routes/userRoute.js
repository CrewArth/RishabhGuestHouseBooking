import express from "express";
import {updateUser, deleteUser} from "../controller/userController.js";
import User from "../models/User.js";

const router = express.Router();

router.put('/:id', updateUser);

// DELETE user by ID
router.delete('/:id', deleteUser);

// Soft Delete User
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false }, 
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

router.patch("/:id/toggle", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive; 
    await user.save();

    res.json({
      message: user.isActive ? "User activated" : "User deactivated",
      user
    });

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});


export default router;