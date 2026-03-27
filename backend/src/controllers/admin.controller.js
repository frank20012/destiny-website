export const getAdminOverview = (req, res) => {
  res.status(200).json({
    message: "Admin overview fetched successfully",
    admin: req.user
  });
};