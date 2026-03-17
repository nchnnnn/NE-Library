const staffService = require("../services/staffServices");
const authService = require("../services/authServices");

// Get all staff with pagination
const getAllStaff = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    if (req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const { rows, total } = await staffService.getAllStaff(limit, offset);

    res.status(200).json({ success: true, data: rows, total, limit, offset });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ success: false, message: "Error fetching staff" });
  }
};

// Get single staff by ID
const getStaffById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const staff = await staffService.getStaffById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    // Check if staff is blocked
    const block = await staffService.isStaffBlocked(req.params.id);
    
    res.status(200).json({ success: true, data: { ...staff, is_blocked: !!block, block_reason: block?.reason || null } });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ success: false, message: "Error fetching staff" });
  }
};

// Update staff user (Admin only)
const updateStaff = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    if (req.user.role_id !== 4) {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const { id } = req.params;
    const existing = await staffService.getStaffById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    const updatedStaff = await staffService.updateStaff(id, req.body);
    if (!updatedStaff) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    // Log activity
    await authService.logActivity(
      id,
      "profile_updated",
      `Account updated by admin (${req.user.first_name} ${req.user.last_name})`,
      "staff",
      existing.employee_id
    );

    res.status(200).json({ success: true, message: "Staff updated successfully", data: updatedStaff });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ success: false, message: "Error updating staff" });
  }
};

// Delete staff user (Admin only)
const deleteStaff = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    if (req.user.role_id !== 4) {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const { id } = req.params;
    const existing = await staffService.getStaffById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account." });
    }

    await staffService.deleteStaff(id);
    res.status(200).json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ success: false, message: "Error deleting staff" });
  }
};

// Block staff from library access
const blockStaff = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    if (req.user.role_id !== 2 && req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { id } = req.params;
    const reason = req.body?.reason;

    const existing = await staffService.getStaffById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    const existingBlock = await staffService.getExistingBlock(id);
    if (existingBlock) {
      return res.status(400).json({ success: false, message: "Staff is already blocked" });
    }

    await staffService.blockStaff(id, req.user.id, reason);

    // Log activity
    await authService.logActivity(
      id,
      "blocked",
      `Blocked by admin: ${reason || "No reason provided"}`,
      "staff",
      existing.employee_id
    );

    res.status(200).json({ success: true, message: "Staff has been blocked from library access" });
  } catch (error) {
    console.error("Error blocking staff:", error);
    res.status(500).json({ success: false, message: "Error blocking staff" });
  }
};

// Unblock staff member
const unblockStaff = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    if (req.user.role_id !== 2 && req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { id } = req.params;
    const existing = await staffService.getStaffById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    const affectedRows = await staffService.unblockStaff(id);
    if (affectedRows === 0) {
      return res.status(400).json({ success: false, message: "Staff is not currently blocked" });
    }

    // Log activity
    await authService.logActivity(
      id,
      "unblocked",
      `Unblocked by admin (${req.user.first_name} ${req.user.last_name})`,
      "staff",
      existing.employee_id
    );

    res.status(200).json({ success: true, message: "Staff has been unblocked" });
  } catch (error) {
    console.error("Error unblocking staff:", error);
    res.status(500).json({ success: false, message: "Error unblocking staff" });
  }
};

// Get staff activity logs
const getStaffActivity = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const limit = parseInt(req.query.limit) || 50;
    const logs = await staffService.getStaffActivity(req.params.id, limit);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching staff activity:", error);
    res.status(500).json({ success: false, message: "Error fetching activity logs" });
  }
};

// Get staff attendance logs
const getStaffAttendance = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const limit = parseInt(req.query.limit) || 50;
    const logs = await staffService.getStaffAttendance(req.params.id, limit);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching staff attendance:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance logs" });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  blockStaff,
  unblockStaff,
  getStaffActivity,
  getStaffAttendance,
};
