import express from "express";
import {
  updateUser,
  deleteUser,
  deactivateUser,
  toggleUserStatus,
} from "../controller/userController.js";

const router = express.Router();

router.put("/:id", updateUser);

// DELETE user by ID
router.delete("/:id", deleteUser);

// Soft Delete User
router.patch("/:id/deactivate", deactivateUser);

router.patch("/:id/toggle", toggleUserStatus);

export default router;