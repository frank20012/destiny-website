import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {},
  { timestamps: true }
);

const Service = mongoose.model("Service", userSchema);

export default Service;