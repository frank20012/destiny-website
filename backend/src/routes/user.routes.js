import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { getMyProfile, getUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/me", protect, getMyProfile);

export default router;