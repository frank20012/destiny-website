import express from "express";
import protect from "../middlewares/auth.middleware.js";
import adminOnly from "../middlewares/admin.middleware.js";
import {
  createTicket,
  getAllTicketsForAdmin,
  getMyTickets,
  getSingleTicket,
  updateTicketStatus
} from "../controllers/ticket.controller.js";

const router = express.Router();

router.post("/", protect, createTicket);
router.get("/", protect, getMyTickets);
router.get("/admin/all", protect, adminOnly, getAllTicketsForAdmin);
router.get("/:id", protect, getSingleTicket);
router.patch("/:id", protect, adminOnly, updateTicketStatus);

export default router;