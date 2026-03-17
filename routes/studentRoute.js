const express = require("express");
const route = express.Router();
const studentController = require("../controllers/studentController");
const {
  authenticateToken,
  requireAdmin,
  requireRole,
} = require("../middleware/auth");


// Get all users - requires management or admin role (role_id 3 or 4)
route.get(
  "/students",
  authenticateToken,
  requireRole(3, 4),
  studentController.getAllStudents,
);

route.get(
  "/students/section/:section",
  authenticateToken,
  requireRole(3, 4),
  studentController.getStudentsBySection,
);

route.get(
  "/students/program/:program",
  authenticateToken,
  requireRole(3, 4),
  studentController.getStudentsByProgram,
);

// Get single user by ID - requires authentication
route.get("/students/:id", authenticateToken, studentController.getStudentById);

// Create user - requires admin or management (role_id 3 or 4)
route.post(
  "/students",
  authenticateToken,
  requireRole(3, 4),
  studentController.createStudent,
);

// Update user - requires admin or management (role_id 3 or 4)
route.put(
  "/students/:id",
  authenticateToken,
  requireRole(3, 4),
  studentController.updateStudent,
);

// Delete user - requires admin only (role_id 4)
route.delete(
  "/students/:id",
  authenticateToken,
  requireAdmin,
  studentController.deleteStudent,
);

// Block user from library - requires librarian (role_id 2), management (role_id 3), or admin (role_id 4)
route.post(
  "/students/:id/block",
  authenticateToken,
  requireRole(2, 3, 4),
  studentController.blockStudent,
);

// Unblock user - requires librarian (role_id 2), management (role_id 3), or admin (role_id 4)
route.post(
  "/students/:id/unblock",
  authenticateToken,
  requireRole(2, 3, 4),
  studentController.unblockStudent,
);

// Get student activity logs
route.get(
  "/students/:id/activity",
  authenticateToken,
  requireRole(3, 4),
  studentController.getStudentActivity,
);

// Get student attendance logs
route.get(
  "/students/:id/attendance",
  authenticateToken,
  requireRole(3, 4),
  studentController.getStudentAttendance,
);

module.exports = route;
