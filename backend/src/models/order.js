import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {},
  { timestamps: true }
);

const Order = mongoose.model("Order", userSchema);

export default Order;