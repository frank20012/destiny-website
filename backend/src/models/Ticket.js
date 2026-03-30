import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ["orders", "wallet", "transactions", "account", "api"],
      required: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    referenceId: {
      type: String,
      default: "",
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["open", "review", "resolved"],
      default: "open"
    },
    adminNote: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;