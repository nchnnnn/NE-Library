const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const statsController = require("../controllers/statsController");

// Dashboard summary stats — librarian, management, admin
router.get(
  "/stats/dashboard",
  authenticateToken,
  requireRole(2, 3, 4),
  statsController.getDashboardStats
);

// Attendance graph data — with period/date/college/program filter
router.get(
  "/stats/attendance-graph",
  authenticateToken,
  requireRole(2, 3, 4),
  statsController.getAttendanceGraph
);

module.exports = router;
