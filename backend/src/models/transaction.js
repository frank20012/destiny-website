import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {},
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", userSchema);

export default Transaction;