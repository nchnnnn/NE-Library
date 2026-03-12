const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../database");

// Helper function to hash password (using bcrypt)
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// Helper function to compare password
const comparePassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

// Generate UUID v4
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, role_id: user.role_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );
};

// Login user (staff only - admin, librarian, management)
const login = async (req, res) => {
  try {
    const { email, password, employee_id } = req.body;

    // Check if credentials provided
    if ((!email && !employee_id) || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email or employee_id and password",
      });
    }

    let query = "";
    let param = "";

    if (email) {
      query = "SELECT * FROM staff_users WHERE email = ?";
      param = email;
    } else if (employee_id) {
      query = "SELECT * FROM staff_users WHERE employee_id = ?";
      param = employee_id;
    }

    const [users] = await db.query(query, [param]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];

    // Check if user has a password set
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Account has no password set. Please contact administrator.",
      });
    }

    // Verify password
    const isMatch = comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    const token = generateToken(user);

    // Get role name
    const [roles] = await db.query("SELECT role_name FROM roles WHERE id = ?", [
      user.role_id,
    ]);
    const roleName = roles.length > 0 ? roles[0].role_name : "unknown";

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_id: user.role_id,
        role_name: roleName,
        employee_id: user.employee_id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during login",
    });
  }
};

// Register new staff user (admin only)
const register = async (req, res) => {
  try {
    const { employee_id, first_name, last_name, email, password, role_id } =
      req.body;

    if (!employee_id || !first_name || !last_name || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide employee_id, first_name, last_name, password, and role_id",
      });
    }

    // Only allow roles 2, 3, 4 (librarian, management, admin)
    if (![2, 3, 4].includes(parseInt(role_id))) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Only staff roles (librarian, management, admin) can be registered.",
      });
    }

    // Check if employee_id already exists
    const [existing] = await db.query(
      "SELECT * FROM staff_users WHERE employee_id = ? OR email = ?",
      [employee_id, email],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Employee ID or email already registered",
      });
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    const [result] = await db.query(
      "INSERT INTO staff_users (role_id, employee_id, first_name, last_name, email, password, qr_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        role_id,
        employee_id,
        first_name,
        last_name,
        email,
        hashedPassword,
        generateUUID(),
        "active",
      ],
    );

    const [newUser] = await db.query("SELECT * FROM staff_users WHERE id = ?", [
      result.insertId,
    ]);

    const token = generateToken(newUser[0]);

    res.status(201).json({
      success: true,
      message: "Staff user registered successfully",
      token,
      user: {
        id: newUser[0].id,
        first_name: newUser[0].first_name,
        last_name: newUser[0].last_name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during registration",
    });
  }
};

// Get current user profile (staff)
const getProfile = async (req, res) => {
  try {
    const [users] = await db.query("SELECT st.id, st.first_name, st.last_name, st.email, st.role_id, r.role_name, st.employee_id, st.status FROM staff_users st, roles r WHERE st.id = ? AND st.role_id = r.id",
       [req.user.id,]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    res.status(200).json({
      success: true,
      user
    });

    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

// Change password (staff)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide currentPassword and newPassword",
      });
    }

    const [users] = await db.query("SELECT * FROM staff_users WHERE id = ?", [
      req.user.id,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "No password set for this account",
      });
    }

    // Verify current password
    const isMatch = comparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = hashPassword(newPassword);

    await db.query("UPDATE staff_users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.user.id,
    ]);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing password",
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  changePassword,
  hashPassword,
  comparePassword,
};
