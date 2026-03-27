import express from "express";
import { getAdminOverview } from "../controllers/admin.controller.js";
import protect from "../middlewares/auth.middleware.js";
import adminOnly from "../middlewares/admin.middleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getAdminOverview);

export default router;