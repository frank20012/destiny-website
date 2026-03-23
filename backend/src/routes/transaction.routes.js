import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "transaction route ready" });
});

export default router;