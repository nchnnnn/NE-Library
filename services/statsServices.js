const db = require("../database");

/**
 * Get overall dashboard statistics
 * - Total students, staff, active events
 * - Attendance counts: today, this week, this month
 */
async function getDashboardStats() {
    // Total students (active)
    const [[{ total_students }]] = await db.query(
        `SELECT COUNT(*) as total_students FROM students WHERE status = 'active'`
    );

    // Total staff
    const [[{ total_staff }]] = await db.query(
        `SELECT COUNT(*) as total_staff FROM staff_users WHERE status = 'active'`
    );

    // Active events right now
    const [[{ active_events }]] = await db.query(
        `SELECT COUNT(*) as active_events FROM events WHERE start_datetime <= NOW() AND end_datetime >= NOW()`
    );

    // Upcoming events (future)
    const [[{ upcoming_events }]] = await db.query(
        `SELECT COUNT(*) as upcoming_events FROM events WHERE start_datetime > NOW()`
    );

    // Total attendance logs
    const [[{ total_logs }]] = await db.query(
        `SELECT COUNT(*) as total_logs FROM attendance_logs`
    );

    // Today's attendance
    const [[{ today_logs }]] = await db.query(
        `SELECT COUNT(*) as today_logs FROM attendance_logs WHERE DATE(time_in) = CURDATE()`
    );

    // This week's attendance
    const [[{ week_logs }]] = await db.query(
        `SELECT COUNT(*) as week_logs FROM attendance_logs WHERE YEARWEEK(time_in) = YEARWEEK(NOW())`
    );

    // This month's attendance
    const [[{ month_logs }]] = await db.query(
        `SELECT COUNT(*) as month_logs FROM attendance_logs WHERE MONTH(time_in) = MONTH(NOW()) AND YEAR(time_in) = YEAR(NOW())`
    );

    // Blocked users count
    const [[{ blocked_users }]] = await db.query(
        `SELECT COUNT(*) as blocked_users FROM user_blocks WHERE unblock_at IS NULL`
    );

    return {
        students: {
            total: total_students,
        },
        staff: {
            total: total_staff,
        },
        events: {
            active: active_events,
            upcoming: upcoming_events,
        },
        attendance: {
            total: total_logs,
            today: today_logs,
            this_week: week_logs,
            this_month: month_logs,
        },
        blocked_users,
    };
}

/**
 * Get attendance graph data for a given period/date range.
 * Supports filters: start_date, end_date, college_id, program_id
 * period options:
 *   - 'today': hourly breakdown for current day
 *   - 'week': daily breakdown for current week
 *   - 'month': weekly breakdown for current month
 *   - 'year': monthly breakdown for current year
 *   - 'custom': daily breakdown for custom date range
 */
async function getAttendanceGraph(period, start_date, end_date, college_id, program_id) {
    const conditions = [];
    const params = [];

    // Date range filter by period
    let dateTrunc;
    if (start_date && end_date) {
        conditions.push("al.time_in >= ? AND al.time_in <= ?");
        params.push(start_date, end_date);
        dateTrunc = "DATE(al.time_in)"; // daily for custom
    } else if (period === 'today') {
        conditions.push("DATE(al.time_in) = CURDATE()");
        dateTrunc = "DATE_FORMAT(al.time_in, '%H:00')"; // hourly
    } else if (period === 'week') {
        conditions.push("al.time_in >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        dateTrunc = "DATE(al.time_in)"; // daily
    } else if (period === 'month') {
        conditions.push("al.time_in >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        dateTrunc = "WEEK(al.time_in)"; // weekly number
    } else if (period === 'year') {
        conditions.push("YEAR(al.time_in) = YEAR(NOW())");
        dateTrunc = "DATE_FORMAT(al.time_in, '%Y-%m')"; // monthly
    } else {
        // Default: last 30 days
        conditions.push("al.time_in >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        dateTrunc = "DATE(al.time_in)"; // daily
    }

    // College/Program filter (only for students)
    if (college_id) {
        conditions.push("p.college_id = ?");
        params.push(college_id);
    }
    if (program_id) {
        conditions.push("sec.program_id = ?");
        params.push(program_id);
    }

    const hasStudentFilter = college_id || program_id;
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const joinClause = hasStudentFilter
        ? `FROM attendance_logs al
           LEFT JOIN students s ON al.user_id = s.id
           LEFT JOIN sections sec ON s.section_id = sec.id
           LEFT JOIN programs p ON sec.program_id = p.id`
        : `FROM attendance_logs al
           LEFT JOIN students s ON al.user_id = s.id`;

    // Student entries
    const [studentGraph] = await db.query(
        `SELECT ${dateTrunc} as date, COUNT(*) as count, 'student' as user_type
         ${joinClause}
         ${whereClause} ${whereClause ? "AND" : "WHERE"} s.id IS NOT NULL
         GROUP BY ${dateTrunc}
         ORDER BY ${dateTrunc} ASC`,
        params
    );

    // Staff entries (no college/program filter)
    let staffGraph = [];
    if (!hasStudentFilter) {
        const staffConditions = conditions.filter(c => !c.includes("p.college_id") && !c.includes("sec.program_id"));
        const staffParams = params.slice(0, staffConditions.length);
        const staffWhere = staffConditions.length > 0 ? `WHERE ${staffConditions.join(" AND ")}` : "";

        const [staffData] = await db.query(
            `SELECT ${dateTrunc} as date, COUNT(*) as count, 'staff' as user_type
             FROM attendance_logs al
             LEFT JOIN staff_users su ON al.user_id = su.id
             ${staffWhere} ${staffWhere ? "AND" : "WHERE"} su.id IS NOT NULL
             GROUP BY ${dateTrunc}
             ORDER BY ${dateTrunc} ASC`,
            staffParams
        );
        staffGraph = staffData;
    }

    return {
        student: studentGraph,
        staff: staffGraph,
        period: period || 'month',
    };
}

module.exports = {
    getDashboardStats,
    getAttendanceGraph,
};
