const express = require("express");
const route = express.Router();
const userController = require("../controllers/userController");
const {
  authenticateToken,
  requireAdmin,
  requireRole,
} = require("../middleware/auth");

// Public route - verify QR code for library entry (used by library kiosk)
route.post("/library/verify", userController.verifyLibraryEntry);

// Get all users - requires management or admin role (role_id 3 or 4)
route.get(
  "/users",
  authenticateToken,
  requireRole(3, 4),
  userController.getAllUsers,
);

// Get single user by ID - requires authentication
route.get("/users/:id", authenticateToken, userController.getUserById);

// Create user - requires admin or management (role_id 3 or 4)
route.post(
  "/users",
  authenticateToken,
  requireRole(3, 4),
  userController.createUser,
);

// Update user - requires admin or management (role_id 3 or 4)
route.put(
  "/users/:id",
  authenticateToken,
  requireRole(3, 4),
  userController.updateUser,
);

// Delete user - requires admin only (role_id 4)
route.delete(
  "/users/:id",
  authenticateToken,
  requireAdmin,
  userController.deleteUser,
);

// Block user from library - requires librarian (role_id 2), management (role_id 3), or admin (role_id 4)
route.post(
  "/users/:id/block",
  authenticateToken,
  requireRole(2, 3, 4),
  userController.blockUser,
);

// Unblock user - requires librarian (role_id 2), management (role_id 3), or admin (role_id 4)
route.post(
  "/users/:id/unblock",
  authenticateToken,
  requireRole(2, 3, 4),
  userController.unblockUser,
);

module.exports = route;
