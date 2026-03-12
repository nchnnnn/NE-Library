const jwt = require("jsonwebtoken");
const db = require("../database");

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from staff_users database
    const [users] = await db.query("SELECT * FROM staff_users WHERE id = ?", [
      decoded.userId,
    ]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role_id !== 4) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

// Require specific roles (1=Student, 2=Faculty, 3=Management, 4=Admin)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role_id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient privileges.",
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireRole,
};
