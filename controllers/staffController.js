const staffService = require("../services/staffServices");

// Get all staff with pagination
const getAllStaff = async (req, res) => {
  try {
    // Check if user is authenticated
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
        message: "Access denied. Only Management and Admin users can view all staff.",
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const { rows, total } = await staffService.getAllStaff(limit, offset);
    res.status(200).json({
      success: true,
      data: rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching staff",
    });
  }
};

// Get single staff by ID
const getStaffById = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    const staff = await staffService.getStaffById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching staff",
    });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
};
