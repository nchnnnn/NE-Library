const jwt = require("jsonwebtoken");
// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, role_id: user.role_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );
};

module.exports = {
  generateToken,
};
