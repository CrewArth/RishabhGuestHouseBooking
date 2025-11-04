import express from "express";
import {updateUser} from "../controller/userController.js";

const router = express.Router();

router.put('/user/:id', updateUser);

export default router;