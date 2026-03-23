const adminOnly = (req, res, next) => {
  next();
};

export default adminOnly;