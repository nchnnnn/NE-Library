const db = require("../database");
const bcrypt = require("bcryptjs");
const { generateUUID } = require("../middleware/qrGenerate");
const { generateStudentNumber } = require("../middleware/generateStudentNum");

// Generate UUID v4

// Get all users
const getAllUsers = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // Check if user has Management (3) or Admin (4) role
    if (req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Management and Admin users can view all users.",
      });
    }

    const [rows] = await db.query("SELECT * FROM users");
    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

// Get single user by ID
const getUserById = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
  }
};

// Generate student number in format: YY-XXXXX-XXX
// YY = current year last 2 digits
// XXXXX = auto-generated based on last user (not stored separately in DB)
// XXX = auto-generated based on last user (not stored separately in DB)


// Create new user
const createUser = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // Check if user has Management (3) or Admin (4) role
    if (req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Management and Admin users can create users.",
      });
    }

    const {
      role_id,
      first_name, 
      last_name,
      password,
      status,
      section_id,
    } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "Please provide first_name and last_name",
      });
    }

    // section_id is required
    if (!section_id) {
      return res.status(400).json({
        success: false,
        message: "section_id is required. Please provide a valid section.",
      });
    }

    // Check if section exists
    const [section] = await db.query(
      "SELECT id, section_name FROM sections WHERE id = ?",
      [section_id]
    );
    if (section.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid section_id. Section does not exist.",
      });
    }

    // Generate email
    const email = first_name.toLowerCase() + "." + last_name.toLowerCase() + "@neu.edu.ph";

    // Check if email already exists
    const [existingEmail] = await db.query(
      "SELECT id, first_name, last_name FROM users WHERE email = ?",
      [email]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A user with name ${first_name} ${last_name} already exists (${email}).`,
      });
    }

    // Auto-generate student number
    const student_number = await generateStudentNumber();

    const [result] = await db.query(
      "INSERT INTO users (role_id, student_number, first_name, last_name, email, password, qr_code, section_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        role_id || 1,
        student_number,
        first_name,
        last_name,
        email,
        password || first_name.toLowerCase() + "." + last_name.toLowerCase(), 
        generateUUID(),
        section_id,
        status || "active",
      ],
    );

    const [newUser] = await db.query("SELECT * FROM users WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser[0],
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // Check if user has Management (3) or Admin (4) role
    if (req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Management and Admin users can update users.",
      });
    }

    const { id } = req.params;
    const {
      role_id,
      student_number,
      employee_id,
      first_name,
      last_name,
      email,
      password,
      qr_code,
      status,
    } = req.body;

    // Check if user exists
    const [existingUser] = await db.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updates = [];
    const values = [];

    if (role_id !== undefined) {
      updates.push("role_id = ?");
      values.push(role_id);
    }
    if (student_number !== undefined) {
      updates.push("student_number = ?");
      values.push(student_number);
    }
    if (employee_id !== undefined) {
      updates.push("employee_id = ?");
      values.push(employee_id);
    }
    if (first_name !== undefined) {
      updates.push("first_name = ?");
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push("last_name = ?");
      values.push(last_name);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (password !== undefined) {
      updates.push("password = ?");
      values.push(bcrypt.hashSync(password, 10));
    }
    if (qr_code !== undefined) {
      updates.push("qr_code = ?");
      values.push(qr_code);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    values.push(id);

    await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [updatedUser] = await db.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser[0],
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // Check if user has Admin (4) role only
    if (req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admin users can delete users.",
      });
    }

    const { id } = req.params;

    const [existingUser] = await db.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await db.query("DELETE FROM users WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};

// Block user from library access
const blockUser = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // Check if user has Librarian (2), Management (3) or Admin (4) role
    if (req.user.role_id !== 2 && req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Librarian, Management, and Admin users can block users.",
      });
    }

    const { id } = req.params;
    const reason = req.body?.reason; // Handle case where body might be undefined

    // Check if user exists
    const [existingUser] = await db.query(
      "SELECT id, first_name, last_name FROM users WHERE id = ?",
      [id],
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already blocked (unblock_at IS NULL means still blocked)
    const [existingBlock] = await db.query(
      "SELECT id FROM user_blocks WHERE user_id = ? AND unblock_at IS NULL",
      [id],
    );

    if (existingBlock.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked",
      });
    }

    // Insert into user_blocks table (no status column - unblock_at NULL means blocked)
    await db.query(
      "INSERT INTO user_blocks (user_id, blocked_by, reason, blocked_at) VALUES (?, ?, ?, NOW())",
      [id, req.user.id, reason || "No reason provided"],
    );

    res.status(200).json({
      success: true,
      message: "User has been blocked from library access",
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({
      success: false,
      message: "Error blocking user",
    });
  }
};

// Unblock user to allow library access
const unblockUser = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // Check if user has Librarian (2), Management (3) or Admin (4) role
    if (req.user.role_id !== 2 && req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Librarian, Management, and Admin users can unblock users.",
      });
    }

    const { id } = req.params;

    const [existingUser] = await db.query("SELECT id FROM users WHERE id = ?", [
      id,
    ]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user_blocks to set unblock_at (unblock_at NOT NULL means unblocked)
    const [result] = await db.query(
      "UPDATE user_blocks SET unblock_at = NOW() WHERE user_id = ? AND unblock_at IS NULL",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "User is not currently blocked",
      });
    }

    res.status(200).json({
      success: true,
      message: "User has been unblocked and can now access the library",
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({
      success: false,
      message: "Error unblocking user",
    });
  }
};

// Verify QR code for library/staff entry (single endpoint for both)
const verifyLibraryEntry = async (req, res) => {
  try {
    const { qr_code } = req.body;

    if (!qr_code) {
      return res.status(400).json({
        success: false,
        message: "Please provide QR code",
      });
    }

    // Helper function to format date
    const formatDate = () => {
      return new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    };

    // Helper function to check for active events
    const getActiveEvent = async () => {
      const now = new Date();
      const [events] = await db.query(
        "SELECT * FROM events WHERE start_time <= ? AND end_time >= ? LIMIT 1",
        [now, now]
      );
      return events.length > 0 ? events[0] : null;
    };

    // First, check if it's a student (in users table)
    const [students] = await db.query(
      `SELECT users.id, users.student_number, users.first_name, users.last_name, 
              users.status, sections.section_name 
       FROM users 
       LEFT JOIN sections ON users.section_id = sections.id 
       WHERE users.qr_code = ?`,
      [qr_code],
    );

    if (students.length > 0) {
      const user = students[0];
      const fullName = user.first_name + " " + user.last_name;

      // Check if user is active
      if (user.status !== "active") {
        // Log denied attempt
        await db.query(
          "INSERT INTO attendance_logs (user_id, user_type, full_name, identifier, time_in, status, remarks) VALUES (?, 'student', ?, ?, NOW(), 'denied', 'Account not active')",
          [user.id, fullName, user.student_number],
        );

        return res.status(403).json({
          success: false,
          message: "User account is not active",
          user: {
            student_number: user.student_number,
            full_name: fullName,
            section: user.section_name,
          },
          time_in: formatDate(),
        });
      }

      // Check if user is blocked in user_blocks table (unblock_at IS NULL = still blocked)
      const [blocks] = await db.query(
        "SELECT * FROM user_blocks WHERE user_id = ? AND unblock_at IS NULL",
        [user.id],
      );

      if (blocks.length > 0) {
        // Log blocked attempt
        await db.query(
          "INSERT INTO attendance_logs (user_id, user_type, full_name, identifier, time_in, status, remarks) VALUES (?, 'student', ?, ?, NOW(), 'blocked', ?)",
          [
            user.id,
            fullName,
            user.student_number,
            blocks[0].reason || "Blocked from library access",
          ],
        );

        return res.status(403).json({
          success: false,
          message: "User is blocked from library access",
          reason: blocks[0].reason || "Blocked from library access",
          user: {
            student_number: user.student_number,
            full_name: fullName,
            section: user.section_name,
          },
          time_in: formatDate(),
        });
      }

      // Entry allowed - check for active events
      const activeEvent = await getActiveEvent();
      const eventRemark = activeEvent 
        ? `Library entry allowed - Event: ${activeEvent.title}` 
        : "Library entry allowed";

      // Log attendance
      await db.query(
        "INSERT INTO attendance_logs (user_id, user_type, full_name, identifier, time_in, status, remarks) VALUES (?, 'student', ?, ?, NOW(), 'valid', ?)",
        [user.id, fullName, user.student_number, eventRemark],
      );

      // Entry allowed - return only needed data
      return res.status(200).json({
        success: true,
        message: activeEvent ? `Library entry allowed - ${activeEvent.title}` : "Library entry allowed",
        user: {
          student_number: user.student_number,
          full_name: fullName,
          section: user.section_name,
        },
        event: activeEvent ? {
          name: activeEvent.title,
          start: activeEvent.start_time,
          end: activeEvent.end_time,
        } : null,
        time_in: formatDate(),
      });
    }

    // Check if it's a staff (in staff_users table)
    const [staff] = await db.query(
      `SELECT s.id, s.employee_id, s.first_name, s.last_name, s.status, s.role_id, r.role_name
       FROM staff_users s
       LEFT JOIN roles r ON s.role_id = r.id
       WHERE s.qr_code = ?`,
      [qr_code],
    );

    if (staff.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found with this QR code",
      });
    }

    const staffMember = staff[0];
    const fullName = staffMember.first_name + " " + staffMember.last_name;

    // Check if staff is active
    if (staffMember.status !== "active") {
      // Log denied attempt
      await db.query(
        "INSERT INTO attendance_logs (user_id, user_type, full_name, identifier, time_in, status, remarks) VALUES (?, 'staff', ?, ?, NOW(), 'denied', 'Staff account not active')",
        [staffMember.id, fullName, staffMember.employee_id],
      );

      return res.status(403).json({
        success: false,
        message: "Staff account is not active",
        user: {
          staff_id: staffMember.employee_id,
          full_name: fullName,
          role: staffMember.role_name,
        },
        time_in: formatDate(),
      });
    }

    // Check if staff is blocked in user_blocks table (unblock_at IS NULL = still blocked)
    const [staffBlocks] = await db.query(
      "SELECT * FROM user_blocks WHERE user_id = ? AND unblock_at IS NULL",
      [staffMember.id],
    );

    if (staffBlocks.length > 0) {
      // Log blocked attempt
      await db.query(
        "INSERT INTO attendance_logs (user_id, user_type, full_name, identifier, time_in, status, remarks) VALUES (?, 'staff', ?, ?, NOW(), 'blocked', ?)",
        [
          staffMember.id,
          fullName,
          staffMember.employee_id,
          staffBlocks[0].reason || "Blocked from library access",
        ],
      );

      return res.status(403).json({
        success: false,
        message: "Staff is blocked from library access",
        reason: staffBlocks[0].reason || "Blocked from library access",
        user: {
          staff_id: staffMember.employee_id,
          full_name: fullName,
          role: staffMember.role_name,
        },
        time_in: formatDate(),
      });
    }

    // Entry allowed - check for active events
    const activeEvent = await getActiveEvent();
    const eventRemark = activeEvent 
      ? `Staff attendance recorded - Event: ${activeEvent.title}` 
      : "Staff attendance recorded";

    // Log attendance
    await db.query(
      "INSERT INTO attendance_logs (user_id, user_type, full_name, identifier, time_in, status, remarks) VALUES (?, 'staff', ?, ?, NOW(), 'valid', ?)",
      [staffMember.id, fullName, staffMember.employee_id, eventRemark],
    );

    // Entry allowed - return only needed data
    return res.status(200).json({
      success: true,
      message: activeEvent ? `Staff attendance recorded - ${activeEvent.title}` : "Staff attendance recorded",
      user: {
        staff_id: staffMember.employee_id,
        full_name: fullName,
        role: staffMember.role_name,
      },
      event: activeEvent ? {
        name: activeEvent.title,
        start: activeEvent.start_time,
        end: activeEvent.end_time,
      } : null,
      time_in: formatDate(),
    });
  } catch (error) {
    console.error("Error in verifyLibraryEntry:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying library entry",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  verifyLibraryEntry,
};
