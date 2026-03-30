import Ticket from "../models/Ticket.js";

export const createTicket = async (req, res, next) => {
  try {
    const { subject, category, priority, referenceId, message } = req.body;

    if (!subject || !category || !message) {
      res.status(400);
      throw new Error("Subject, category, and message are required");
    }

    const ticket = await Ticket.create({
      user: req.user._id,
      subject,
      category,
      priority,
      referenceId,
      message
    });

    res.status(201).json({
      message: "Ticket created successfully",
      ticket
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Your tickets fetched successfully",
      count: tickets.length,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(
      "user",
      "firstName lastName email"
    );

    if (!ticket) {
      res.status(404);
      throw new Error("Ticket not found");
    }

    if (
      ticket.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not allowed to view this ticket");
    }

    res.status(200).json({
      message: "Ticket fetched successfully",
      ticket
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTicketsForAdmin = async (req, res, next) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "All tickets fetched successfully",
      count: tickets.length,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      res.status(404);
      throw new Error("Ticket not found");
    }

    if (status) {
      ticket.status = status;
    }

    if (adminNote !== undefined) {
      ticket.adminNote = adminNote;
    }

    await ticket.save();

    res.status(200).json({
      message: "Ticket updated successfully",
      ticket
    });
  } catch (error) {
    next(error);
  }
};