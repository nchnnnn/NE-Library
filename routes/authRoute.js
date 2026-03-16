const express = require("express");
const route = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Public routes
route.post("/auth/login", authController.login);
route.post("/auth/register", authenticateToken, requireAdmin, authController.register);
route.post("/library/verify", authController.verifyLibraryEntry);

// Protected routes
route.get("/auth/profile", authenticateToken, authController.getProfile);
route.post("/auth/change-password", authenticateToken, authController.changePassword);
route.post("/auth/logout", authenticateToken, (req, res) => {
    // Client handles token removal, just acknowledge logout
    res.json({ success: true, message: "Logged out successfully" });
});

module.exports = route;
