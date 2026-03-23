import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {},
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", userSchema);

export default Ticket;