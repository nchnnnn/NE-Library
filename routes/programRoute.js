const express = require("express");
const route = express.Router();
const programController = require("../controllers/programController");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Public routes - requires authentication
route.get("/programs", authenticateToken, programController.getAllPrograms);
route.get("/programs/college/:collegeId", authenticateToken, programController.getProgramsByCollege);
route.get("/programs/:id", authenticateToken, programController.getProgramById);

// Protected routes - require admin (role_id = 4) or management (role_id = 3)
route.post("/programs", authenticateToken, requireRole(3, 4), programController.createProgram);
route.put("/programs/:id", authenticateToken, requireRole(3, 4), programController.updateProgram);
route.delete("/programs/:id", authenticateToken, requireRole(4), programController.deleteProgram);

module.exports = route;
