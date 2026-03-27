export const getUsers = (req, res) => {
  res.json({ message: "Get users controller" });
};

export const getMyProfile = (req, res) => {
  res.status(200).json({
    message: "Profile fetched successfully",
    user: req.user
  });
};