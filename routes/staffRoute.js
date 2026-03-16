const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { authenticateToken, requireAdmin, requireRole } = require("../middleware/auth");

// Get all staff - requires management or admin role (role_id 3 or 4)
router.get(
  "/staff",
  authenticateToken,
  requireRole(3, 4),
  staffController.getAllStaff,
);

// Get single staff by ID
router.get("/staff/:id", authenticateToken, requireRole(3, 4), staffController.getStaffById);

module.exports = router;
