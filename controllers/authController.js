const authService = require("../services/authServices");
const { formatDate } = require("../middleware/formatDate");
const { generateEmployeeId } = require("../middleware/generateEmployeeId");

// Login user (staff only - admin, librarian, management)
const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email ? req.body.email.trim() : undefined;
    const employee_id = req.body.employee_id
      ? req.body.employee_id.trim()
      : undefined;

    // Check if credentials provided
    if ((!email && !employee_id) || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email or employee_id and password",
      });
    }

    let user = null;

    if (email) {
      user = await authService.findStaffByEmail(email);
    } else if (employee_id) {
      user = await authService.findStaffByEmployeeId(employee_id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user has a password set
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Account has no password set. Please contact administrator.",
      });
    }

    // Verify password
    const isMatch = authService.comparePassword(password, user.password);

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

    const token = authService.generateToken(user);

    // Get role name
    const roleName = await authService.getRoleName(user.role_id);

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
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
    });
  }
};

// Register new staff user (admin only)
const register = async (req, res) => {
  try {
    const { employee_id, first_name, last_name, password, role_id } = req.body;

    // Validate required fields FIRST before any async operations
    if (!first_name || !last_name || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: "Please provide first_name, last_name, password, and role_id",
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

    // Generate email from first_name and last_name
    const email =
      first_name.trim().toLowerCase() +
      "." +
      last_name.trim().toLowerCase() +
      "@neu.edu.ph";

    // Check if email already exists
    const existingEmail = await authService.checkEmailExists(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `A staff user with name ${first_name} ${last_name} already exists (${email}).`,
      });
    }

    // If employee_id not provided, auto-generate it
    const empId = employee_id || (await generateEmployeeId());

    // Check if employee_id already exists (only if explicitly provided)
    if (employee_id) {
      const existing = await authService.checkEmployeeIdExists(
        employee_id.trim(),
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Employee ID already registered",
        });
      }
    }

    const newUser = await authService.createStaffUser(
      role_id,
      empId,
      first_name,
      last_name,
      email,
      password,
    );

    const token = authService.generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Staff user registered successfully",
      token,
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
      datetimestamp: formatDate(),
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      success: false,
      message: "Error during registration",
    });
  }
};

// Get current user profile (staff)
const getProfile = async (req, res) => {
  try {
    const user = await authService.findStaffById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
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
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Please provide current_password and new_password",
      });
    }

    const user = await authService.findStaffById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "No password set for this account",
      });
    }

    // Verify current password
    const isMatch = authService.comparePassword(
      current_password,
      user.password,
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    await authService.updatePassword(req.user.id, new_password);

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

// Unified QR verify for library entry - handles QR, student_number, or student account (email+password)
const verifyLibraryEntry = async (req, res) => {
  try {
    const { qr_code, student_number, email, password } = req.body;

    if (!qr_code && !student_number && !(email && password)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide QR code, student number, or student email + password",
      });
    }

    // Helper function to format date
    const formatDateTime = () => {
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

    // --- Helper: process student entry ---
    // At this point the student EXISTS. Check: blocked → inactive → allow
    const processStudentEntry = async (student) => {
      // 1. Is the student blocked?
      const block = await authService.isUserBlocked(student.id);
      if (block) {
        await authService.logActivity(
          student.id,
          "blocked_entry",
          block.reason || "Blocked from library access",
          "student",
          student.student_number,
        );
        return res.status(403).json({
          success: false,
          message: "Student is blocked from library access",
          reason: block.reason || "Blocked",
          user: {
            student_number: student.student_number,
            name: `${student.first_name} ${student.last_name}`,
            type: "student",
          },
          time: formatDateTime(),
        });
      }

      // 2. Is the student account active?
      if (student.status !== "active") {
        await authService.logActivity(
          student.id,
          "blocked_entry",
          "Student account not active",
          "student",
          student.student_number,
        );
        return res.status(403).json({
          success: false,
          message: "Student account is not active",
          user: {
            student_number: student.student_number,
            name: `${student.first_name} ${student.last_name}`,
            type: "student",
          },
          time: formatDateTime(),
        });
      }

      // 3. Student is good — log attendance and allow entry
      const activeEvent = await authService.getActiveEvent();
      const purposeRemark = req.body.purpose ? `[${req.body.purpose}] ` : "";
      const eventRemark = activeEvent
        ? `${purposeRemark}Library entry - Event: ${activeEvent.title}`
        : `${purposeRemark}Library entry allowed`;
      await authService.logAttendance(student.id, eventRemark);

      return res.status(200).json({
        success: true,
        message: activeEvent
          ? `Library entry allowed - ${activeEvent.title}`
          : "Library entry allowed",
        user: {
          id: student.student_number,
          name: student.first_name + " " + student.last_name,
          section: student.section_name || "N/A",
          college: student.college_name || "N/A",
          type: "student",
        },
        event: activeEvent
          ? {
              name: activeEvent.title,
              start: activeEvent.start_datetime,
              end: activeEvent.end_datetime,
            }
          : null,
        time: formatDateTime(),
      });
    };

    // --- MODE 1: Determine User Identity ---
    let student = null;
    let staffMember = null;

    if (email && password) {
      student = await authService.findStudentByEmail(email);
      if (student) {
        if (
          !student.password ||
          !authService.comparePassword(password, student.password)
        ) {
          return res
            .status(401)
            .json({ success: false, message: "Invalid student credentials" });
        }
      } else {
        staffMember = await authService.findStaffByEmail(email);
        if (staffMember) {
          if (
            !staffMember.password ||
            !authService.comparePassword(password, staffMember.password)
          ) {
            return res
              .status(401)
              .json({ success: false, message: "Invalid staff credentials" });
          }
        } else {
          return res
            .status(404)
            .json({ success: false, message: "Account not found" });
        }
      }
    } else if (qr_code) {
      student = await authService.findStudentByQR(qr_code);
      if (!student) staffMember = await authService.findStaffByQR(qr_code);
    } else if (student_number) {
      student = await authService.findStudentByNumber(student_number);
      if (!student)
        staffMember = await authService.findStaffByEmployeeId(student_number);
    }

    // --- MODE 2: Process Student ---
    if (student) {
      return await processStudentEntry(student);
    }
    // --- MODE 3: Staff QR Code ---
    if (staffMember) {
      if (staffMember.status !== "active") {
        await authService.logActivity(
          staffMember.id,
          "blocked_entry",
          "Staff account not active",
          "staff",
          staffMember.employee_id,
        );
        return res.status(403).json({
          success: false,
          message: "Staff account is not active",
          user: {
            staff_id: staffMember.employee_id,
            role: staffMember.role_name,
            type: "staff",
            time: formatDateTime(),
          },
        });
      }

      const block = await authService.isUserBlocked(staffMember.id);
      if (block) {
        await authService.logActivity(
          staffMember.id,
          "blocked_entry",
          block.reason || "Blocked from library access",
          "staff",
          staffMember.employee_id,
        );
        return res.status(403).json({
          success: false,
          message: "Staff is blocked from library access",
          reason: block.reason || "Blocked",
          user: {
            staff_id: staffMember.employee_id,
            role: staffMember.role_name,
            type: "staff",
            time: formatDateTime(),
          },
        });
      }

      const activeEvent = await authService.getActiveEvent();
      const purposeRemark = req.body.purpose ? `[${req.body.purpose}] ` : "";
      const eventRemark = activeEvent
        ? `${purposeRemark}Staff attendance - Event: ${activeEvent.title}`
        : `${purposeRemark}Staff attendance recorded`;
      await authService.logAttendance(staffMember.id, eventRemark);

      return res.status(200).json({
        success: true,
        message: activeEvent
          ? `Staff attendance - ${activeEvent.title}`
          : "Staff attendance recorded",
        user: {
          staff_id: staffMember.employee_id,
          name: `${staffMember.first_name} ${staffMember.last_name}`,
          role: staffMember.role_name,
          type: "staff",
          time: formatDateTime(),
        },
        event: activeEvent
          ? {
              name: activeEvent.title,
              start: activeEvent.start_datetime,
              end: activeEvent.end_datetime,
            }
          : null,
      });
    }

    // Not found in either table
    return res
      .status(404)
      .json({
        success: false,
        message: "No user found with provided credentials",
      });
  } catch (error) {
    console.error("Error in verifyLibraryEntry:", error);
    res
      .status(500)
      .json({ success: false, message: "Error verifying library entry" });
  }
};

// Look up user details without verifying entry (for purpose modal)

module.exports = {
  login,
  register,
  getProfile,
  changePassword,
  verifyLibraryEntry,
};
