const db = require("../database");

// Get attendance logs (with optional filters) — returns {logs, total}
async function getAttendanceLogs(
  user_type,
  status,
  start_date,
  end_date,
  limit = 10,
  offset = 0,
  search = "",
  college_id = "",
  program_id = "",
  year_level = "",
) {
  let baseQuery = `
      FROM attendance_logs al
      LEFT JOIN students u ON al.user_id = u.id
      LEFT JOIN staff_users su ON al.user_id = su.id
      LEFT JOIN sections sec ON u.section_id = sec.id
      LEFT JOIN programs prog ON sec.program_id = prog.id
      LEFT JOIN colleges col ON prog.college_id = col.id
    `;

  const conditions = [];
  const params = [];

  if (user_type === "student")
    conditions.push("u.id IS NOT NULL AND su.id IS NULL");
  if (user_type === "staff")
    conditions.push("su.id IS NOT NULL AND u.id IS NULL");

  if (start_date) {
    conditions.push("al.time_in >= ?");
    params.push(start_date);
  }

  if (end_date) {
    conditions.push("al.time_in <= ?");
    params.push(end_date);
  }

  // Search by name or ID
  if (search) {
    conditions.push(
      "(u.first_name LIKE ? OR u.last_name LIKE ? OR u.student_number LIKE ? OR su.first_name LIKE ? OR su.last_name LIKE ? OR su.employee_id LIKE ?)",
    );
    const searchParam = `%${search}%`;
    params.push(
      searchParam,
      searchParam,
      searchParam,
      searchParam,
      searchParam,
      searchParam,
    );
  }

  // Filter by college (by name)
  if (college_id) {
    conditions.push("(col.college_name LIKE ? OR prog.program_name LIKE ?)");
    const collegeParam = `%${college_id}%`;
    params.push(collegeParam, collegeParam);
  }

  // Filter by program (by ID)
  if (program_id) {
    conditions.push("prog.id = ?");
    params.push(program_id);
  }

  // Filter by year level
  if (year_level) {
    conditions.push("sec.year_level = ?");
    params.push(year_level);
  }

  const whereClause =
    conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

  // Total count for pagination
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total ${baseQuery} ${whereClause}`,
    params,
  );

  const [logs] = await db.query(
    `SELECT al.*,
               CONCAT(COALESCE(u.first_name, su.first_name), ' ', COALESCE(u.last_name, su.last_name)) as user_name,
               COALESCE(u.student_number, su.employee_id) as student_number,
               CASE WHEN u.id IS NOT NULL THEN 'student' ELSE 'staff' END as user_type,
               COALESCE(u.status, su.status) as user_status,
               sec.section_name,
               prog.program_name,
               col.college_name,
               'valid' as status
          ${baseQuery} ${whereClause}
          ORDER BY al.time_in DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)],
  );

  console.log(logs);
  return { logs, total };
}

// Get attendance statistics
async function getAttendanceStats(
  start_date,
  end_date,
  college_id,
  program_id,
) {
  const conditions = [];
  const params = [];

  if (start_date && end_date) {
    conditions.push("al.time_in >= ? AND al.time_in <= ?");
    params.push(start_date, end_date);
  }

  if (college_id || program_id) {
    if (college_id) {
      conditions.push("p.college_id = ?");
      params.push(college_id);
    }
    if (program_id) {
      conditions.push("sec.program_id = ?");
      params.push(program_id);
    }
  }

  const whereClause =
    conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  // Removed al.user_type from join because attendance_logs has no such column in active db
  const baseJoins = `
      FROM attendance_logs al
      LEFT JOIN students s ON al.user_id = s.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN programs p ON sec.program_id = p.id
    `;

  // Total entries
  const [totalResult] = await db.query(
    `SELECT COUNT(*) as total ${baseJoins} ${whereClause}`,
    params,
  );

  // Today's entries
  const todayConditions = [
    "DATE(al.time_in) = CURDATE()",
    ...conditions.filter((c) => !c.includes("time_in")),
  ];
  const todayParams = params.slice(start_date && end_date ? 2 : 0);
  const [todayResult] = await db.query(
    `SELECT COUNT(*) as today ${baseJoins} WHERE ${todayConditions.join(" AND ")}`,
    todayParams,
  );

  // This week's entries
  const weekConditions = [
    "YEARWEEK(al.time_in) = YEARWEEK(NOW())",
    ...conditions.filter((c) => !c.includes("time_in")),
  ];
  const [weekResult] = await db.query(
    `SELECT COUNT(*) as this_week ${baseJoins} WHERE ${weekConditions.join(" AND ")}`,
    todayParams,
  );

  // Graph Data Groups (Daily)
  const [graphData] = await db.query(
    `SELECT DATE(al.time_in) as date, COUNT(*) as count 
         ${baseJoins} ${whereClause} 
         GROUP BY DATE(al.time_in) 
         ORDER BY DATE(al.time_in) ASC`,
    params,
  );

  // By user type — query student count and staff count separately
  const [studentCount] = await db.query(
    `SELECT COUNT(*) as cnt
         FROM attendance_logs al
         LEFT JOIN students s ON al.user_id = s.id
         LEFT JOIN sections sec ON s.section_id = sec.id
         LEFT JOIN programs p ON sec.program_id = p.id
         WHERE s.id IS NOT NULL ${conditions.length ? "AND " + conditions.join(" AND ") : ""}`,
    params,
  );
  const [staffCount] = await db.query(
    `SELECT COUNT(*) as cnt
         FROM attendance_logs al
         LEFT JOIN staff_users su ON al.user_id = su.id
         WHERE su.id IS NOT NULL ${conditions.filter((c) => !c.includes("sec") && !c.includes("p.")).length ? "AND " + conditions.filter((c) => !c.includes("sec") && !c.includes("p.")).join(" AND ") : ""}`,
    params.slice(
      0,
      conditions.filter((c) => !c.includes("sec") && !c.includes("p.")).length,
    ),
  );

  return {
    total: totalResult[0]?.total || 0,
    today: todayResult[0]?.today || 0,
    this_week: weekResult[0]?.this_week || 0,
    by_status: [{ status: "valid", count: totalResult[0]?.total || 0 }],
    by_user_type: [
      { user_type: "student", count: studentCount[0]?.cnt || 0 },
      { user_type: "staff", count: staffCount[0]?.cnt || 0 },
    ],
    graph_data: graphData,
  };
}

// Get user activity (specific user logs)
async function getUserActivity(user_id, user_type, limit = 50) {
  const [logs] = await db.query(
    `SELECT * FROM attendance_logs 
         WHERE user_id = ?
         ORDER BY time_in DESC
         LIMIT ?`,
    [user_id, parseInt(limit)],
  );
  return logs;
}

// Get blocked users list
async function getBlockedUsers() {
  const [blocks] = await db.query(
    `SELECT ub.*, 
                u.first_name, u.last_name, u.student_number,
                s.first_name as blocked_by_name, s.last_name as blocked_by_lastname
         FROM user_blocks ub
         LEFT JOIN students u ON ub.user_id = u.id
         LEFT JOIN staff_users s ON ub.blocked_by = s.id
         WHERE ub.unblock_at IS NULL
         ORDER BY ub.blocked_at DESC`,
  );
  return blocks;
}

module.exports = {
  getAttendanceLogs,
  getAttendanceStats,
  getUserActivity,
  getBlockedUsers,
};
