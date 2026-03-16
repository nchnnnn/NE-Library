const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const eventController = require("../controllers/eventController");

// Public routes
// Get active events (for QR scan to check)
router.get("/events/active", eventController.getActiveEvents);

// Get upcoming events
router.get("/events/upcoming", eventController.getUpcomingEvents);

// Protected routes (Management and Admin only - role 3 and 4)
router.get(
  "/events",
  authenticateToken,
  requireRole(3, 4),
  eventController.getAllEvents
);

router.get(
  "/events/:id",
  authenticateToken,
  requireRole(3, 4),
  eventController.getEventById
);

router.post(
  "/events",
  authenticateToken,
  requireRole(3, 4),
  eventController.createEvent
);

router.put(
  "/events/:id",
  authenticateToken,
  requireRole(3, 4),
  eventController.updateEvent
);

router.delete(
  "/events/:id",
  authenticateToken,
  requireRole(3, 4),
  eventController.deleteEvent
);

module.exports = router;
