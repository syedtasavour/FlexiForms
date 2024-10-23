const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    // If no token, continue without setting user
    return next();
  }

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = { userId: verified.userId };
    next();
  } catch (error) {
    // If token is invalid, continue without setting user
    next();
  }
};
