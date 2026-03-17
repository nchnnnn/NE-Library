const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { authenticateToken, requireAdmin, requireRole } = require("../middleware/auth");

// Get all staff - requires management or admin role (role_id 3 or 4)
router.get("/staff", authenticateToken, requireRole(3, 4), staffController.getAllStaff);

// Get single staff by ID
router.get("/staff/:id", authenticateToken, requireRole(3, 4), staffController.getStaffById);

// Update staff - admin only (role_id 4)
router.put("/staff/:id", authenticateToken, requireAdmin, staffController.updateStaff);

// Delete staff - admin only (role_id 4)
router.delete("/staff/:id", authenticateToken, requireAdmin, staffController.deleteStaff);

// Block staff - roles 2, 3, 4
router.post("/staff/:id/block", authenticateToken, requireRole(2, 3, 4), staffController.blockStaff);

// Unblock staff - roles 2, 3, 4
router.post("/staff/:id/unblock", authenticateToken, requireRole(2, 3, 4), staffController.unblockStaff);

// Get staff activity logs
router.get("/staff/:id/activity", authenticateToken, requireRole(3, 4), staffController.getStaffActivity);

// Get staff attendance logs
router.get("/staff/:id/attendance", authenticateToken, requireRole(3, 4), staffController.getStaffAttendance);

module.exports = router;
