import express from "express";
import {updateUser, deleteUser} from "../controller/userController.js";

const router = express.Router();

router.put('/user/:id', updateUser);
// DELETE user by ID
router.delete('/:id', deleteUser);

export default router;