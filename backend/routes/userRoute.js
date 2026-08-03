import express from "express";
import {
  updateUser,
  deleteUser,
  deactivateUser,
  toggleUserStatus,
} from "../controller/userController.js";
import { authenticate } from "../middlewares/auth.js";
import { uploadESignature, processAndUploadESignature } from "../middlewares/imageUpload.js";

const router = express.Router();


router.put("/:id", authenticate, uploadESignature, processAndUploadESignature, updateUser);

// DELETE user by ID
router.delete("/:id", authenticate, deleteUser);

// Soft Delete User
router.patch("/:id/deactivate", authenticate, deactivateUser);

router.patch("/:id/toggle", authenticate, toggleUserStatus);

export default router;