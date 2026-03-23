import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Services route ready" });
});

export default router;