const express = require("express");
const route = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

// Public routes
route.post("/auth/login", authController.login);
route.post("/auth/register", authController.register);

// Protected routes
route.get("/auth/profile", authenticateToken, authController.getProfile);
route.post("/auth/change-password", authenticateToken, authController.changePassword);

module.exports = route;
