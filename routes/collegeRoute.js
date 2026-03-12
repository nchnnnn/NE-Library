const express = require("express");
const route = express.Router();
const collegeController = require("../controllers/collegeController");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Public routes - requires authentication
route.get("/colleges", authenticateToken, collegeController.getAllColleges);
route.get("/colleges/:id", authenticateToken, collegeController.getCollegeById);

// Protected routes - require admin (role_id = 4) or management (role_id = 3)
route.post("/colleges", authenticateToken, requireRole(3, 4), collegeController.createCollege);
route.put("/colleges/:id", authenticateToken, requireRole(3, 4), collegeController.updateCollege);
route.delete("/colleges/:id", authenticateToken, requireRole(4), collegeController.deleteCollege);

module.exports = route;
