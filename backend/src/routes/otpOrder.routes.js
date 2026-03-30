import express from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  cancelOtpOrder,
  createOtpOrder,
  getMyOtpOrders,
  getSingleOtpOrder
} from "../controllers/otpOrder.controller.js";

const router = express.Router();

router.post("/", protect, createOtpOrder);
router.get("/", protect, getMyOtpOrders);
router.get("/:id", protect, getSingleOtpOrder);
router.patch("/:id/cancel", protect, cancelOtpOrder);

export default router;