import express from "express";
import {updateUser, deleteUser} from "../controller/userController.js";
import User from "../models/User.js";

const router = express.Router();

router.put('/:id', updateUser);
// DELETE user by ID
router.delete('/:id', deleteUser);

// Soft Delete User
router.patch('/user/:id/deactivate', async (req, res) => {
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

export default router;