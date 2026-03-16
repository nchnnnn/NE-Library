const logService = require("../services/logServices");

// Get attendance logs (with optional filters)
const getAttendanceLogs = async (req, res) => {
  try {
    const { user_type, status, start_date, end_date, search, college_id } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    console.log("Fetching attendance logs with filters:", { user_type, status, start_date, end_date, search, college_id, limit, offset });

    const { logs, total } = await logService.getAttendanceLogs(user_type, status, start_date, end_date, limit, offset, search, college_id);

    res.json({
      success: true,
      data: logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching attendance logs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance logs",
    });
  }
};

// Get attendance statistics
const getAttendanceStats = async (req, res) => {
  try {
    const { start_date, end_date, college_id, program_id } = req.query;

    const stats = await logService.getAttendanceStats(start_date, end_date, college_id, program_id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance statistics",
    });
  }
};

// Get user activity (specific user logs)
const getUserActivity = async (req, res) => {
  try {
    const { user_id, user_type } = req.params;
    const { limit = 50 } = req.query;

    if (!user_id || !user_type) {
      return res.status(400).json({
        success: false,
        message: "user_id and user_type are required",
      });
    }

    const logs = await logService.getUserActivity(user_id, user_type, limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user activity",
    });
  }
};

// Get blocked users list
const getBlockedUsers = async (req, res) => {
  try {
    const blocks = await logService.getBlockedUsers();

    res.json({
      success: true,
      data: blocks,
      count: blocks.length,
    });
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching blocked users",
    });
  }
};

module.exports = {
  getAttendanceLogs,
  getAttendanceStats,
  getUserActivity,
  getBlockedUsers,
};
