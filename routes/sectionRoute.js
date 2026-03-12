const express = require("express");
const route = express.Router();
const sectionController = require("../controllers/sectionController");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Public routes - requires authentication
route.get("/sections", authenticateToken, sectionController.getAllSections);
route.get("/sections/program/:programId", authenticateToken, sectionController.getSectionsByProgram);
route.get("/sections/:id", authenticateToken, sectionController.getSectionById);

// Protected routes - require admin (role_id = 4) or management (role_id = 3)
route.post("/sections", authenticateToken, requireRole(3, 4), sectionController.createSection);
route.put("/sections/:id", authenticateToken, requireRole(3, 4), sectionController.updateSection);
route.delete("/sections/:id", authenticateToken, requireRole(4), sectionController.deleteSection);

module.exports = route;
