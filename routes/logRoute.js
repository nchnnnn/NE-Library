const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const logController = require("../controllers/logController");

// Protected routes (Management and Admin only - role 3 and 4)
router.get(
  "/logs/attendance",
  authenticateToken,
  requireRole(2, 3, 4),
  logController.getAttendanceLogs
);

router.get(
  "/logs/attendance/stats",
  authenticateToken,
  requireRole(2, 3, 4),
  logController.getAttendanceStats
);

router.get(
  "/logs/activity/:user_type/:user_id",
  authenticateToken,
  requireRole(2, 3, 4),
  logController.getUserActivity
);

router.get(
  "/logs/blocked",
  authenticateToken,
  requireRole(2, 3, 4),
  logController.getBlockedUsers
);

module.exports = router;
