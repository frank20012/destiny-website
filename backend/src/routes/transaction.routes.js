import express from "express";
import protect from "../middlewares/auth.middleware.js";
import adminOnly from "../middlewares/admin.middleware.js";
import {
  getAllTransactionsForAdmin,
  getTransactions
} from "../controllers/transaction.controller.js";

const router = express.Router();

router.get("/", protect, getTransactions);
router.get("/admin/all", protect, adminOnly, getAllTransactionsForAdmin);

export default router;