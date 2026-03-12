const db = require("../database");

// Get attendance logs (with optional filters)
const getAttendanceLogs = async (req, res) => {
  try {
    const { user_type, status, start_date, end_date, limit = 100 } = req.query;

    let query = `
      SELECT al.*, 
             CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM attendance_logs al
      LEFT JOIN users u ON al.user_id = u.id AND al.user_type = 'student'
    `;

    const conditions = [];
    const params = [];

    if (user_type) {
      conditions.push("al.user_type = ?");
      params.push(user_type);
    }

    if (status) {
      conditions.push("al.status = ?");
      params.push(status);
    }

    if (start_date) {
      conditions.push("al.time_in >= ?");
      params.push(start_date);
    }

    if (end_date) {
      conditions.push("al.time_in <= ?");
      params.push(end_date);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY al.time_in DESC LIMIT ?";
    params.push(parseInt(limit));

    const [logs] = await db.query(query, params);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
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
    const { start_date, end_date } = req.query;

    let dateFilter = "";
    const params = [];

    if (start_date && end_date) {
      dateFilter = "WHERE time_in >= ? AND time_in <= ?";
      params.push(start_date, end_date);
    }

    // Total entries
    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total FROM attendance_logs ${dateFilter}`,
      params
    );

    // By status
    const [statusResult] = await db.query(
      `SELECT status, COUNT(*) as count FROM attendance_logs ${dateFilter} GROUP BY status`,
      params
    );

    // By user type
    const [typeResult] = await db.query(
      `SELECT user_type, COUNT(*) as count FROM attendance_logs ${dateFilter} GROUP BY user_type`,
      params
    );

    // Today's entries
    const [todayResult] = await db.query(
      `SELECT COUNT(*) as today FROM attendance_logs WHERE DATE(time_in) = CURDATE()`
    );

    // This week's entries
    const [weekResult] = await db.query(
      `SELECT COUNT(*) as this_week FROM attendance_logs WHERE YEARWEEK(time_in) = YEARWEEK(NOW())`
    );

    res.json({
      success: true,
      data: {
        total: totalResult[0].total,
        today: todayResult[0].today,
        this_week: weekResult[0].this_week,
        by_status: statusResult[0],
        by_user_type: typeResult[0],
      },
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

    const [logs] = await db.query(
      `SELECT * FROM attendance_logs 
       WHERE user_id = ? AND user_type = ?
       ORDER BY time_in DESC
       LIMIT ?`,
      [user_id, user_type, parseInt(limit)]
    );

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
    const [blocks] = await db.query(
      `SELECT ub.*, 
              u.first_name, u.last_name, u.student_number,
              s.first_name as blocked_by_name, s.last_name as blocked_by_lastname
       FROM user_blocks ub
       LEFT JOIN users u ON ub.user_id = u.id
       LEFT JOIN staff_users s ON ub.blocked_by = s.id
       WHERE ub.unblock_at IS NULL
       ORDER BY ub.blocked_at DESC`
    );

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
