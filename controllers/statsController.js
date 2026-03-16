const statsService = require("../services/statsServices");

/**
 * GET /stats/dashboard
 * Returns total students, staff, events, and attendance counts
 * Access: Librarian (2), Management (3), Admin (4)
 */
const getDashboardStats = async (req, res) => {
  try {
    const stats = await statsService.getDashboardStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
    });
  }
};

/**
 * GET /stats/attendance-graph
 * Query params:
 *   - period: 'week' | 'month' | 'year' | 'custom'
 *   - start_date: ISO date string (for custom range)
 *   - end_date: ISO date string (for custom range)
 *   - college_id: filter by college (optional)
 *   - program_id: filter by program (optional)
 * Access: Librarian (2), Management (3), Admin (4)
 */
const getAttendanceGraph = async (req, res) => {
  try {
    const { period, start_date, end_date, college_id, program_id } = req.query;

    // Validate custom range
    if (period === "custom" && (!start_date || !end_date)) {
      return res.status(400).json({
        success: false,
        message: "start_date and end_date are required for custom period",
      });
    }

    const graph = await statsService.getAttendanceGraph(
      period || "month",
      start_date,
      end_date,
      college_id,
      program_id
    );

    res.json({
      success: true,
      data: graph,
    });
  } catch (error) {
    console.error("Error fetching attendance graph:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance graph data",
    });
  }
};

module.exports = {
  getDashboardStats,
  getAttendanceGraph,
};
