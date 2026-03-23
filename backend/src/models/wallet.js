import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {},
  { timestamps: true }
);

const Wallet = mongoose.model("Wallet", userSchema);

export default Wallet;