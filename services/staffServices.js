const db = require("../database");
const { hashPassword } = require("../middleware/hashPassword");

// Helper: Remove sensitive fields from staff object
function sanitizeStaff(staff) {
  if (!staff) return null;
  const { password, qr_code, ...safe } = staff;
  return safe;
}

// Helper: Remove sensitive fields from array of staff
function sanitizeStaffList(staff) {
  return staff.map(sanitizeStaff);
}

// Get all staff with role info (paginated)
async function getAllStaff(limit = 10, offset = 0) {
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM staff_users`,
  );

  const [rows] = await db.query(
    `SELECT 
            staff_users.id,
            staff_users.employee_id, 
            staff_users.first_name, 
            staff_users.last_name, 
            staff_users.email, 
            staff_users.profile_image,
            staff_users.status, 
            staff_users.created_at,
            staff_users.role_id,
            roles.role_name
         FROM staff_users 
         LEFT JOIN roles ON staff_users.role_id = roles.id
         ORDER BY staff_users.id DESC
         LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)],
  );
  return { rows: sanitizeStaffList(rows), total };
}

// Get single staff by ID with full details
async function getStaffById(id) {
  const [rows] = await db.query(
    `SELECT 
            staff_users.id,
            staff_users.employee_id, 
            staff_users.first_name, 
            staff_users.last_name, 
            staff_users.email, 
            staff_users.profile_image,
            staff_users.status, 
            staff_users.created_at,
            staff_users.role_id,
            roles.role_name
         FROM staff_users 
         LEFT JOIN roles ON staff_users.role_id = roles.id
         WHERE staff_users.id = ?`,
    [id],
  );
  return rows[0] ? sanitizeStaff(rows[0]) : null;
}

// Update staff user fields
async function updateStaff(id, fields) {
  const allowed = ["first_name", "last_name", "email", "role_id", "status"];
  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (fields.password !== undefined && fields.password !== "") {
    updates.push("password = ?");
    values.push(hashPassword(fields.password));
  }

  if (updates.length === 0) return null;

  values.push(id);
  await db.query(`UPDATE staff_users SET ${updates.join(", ")} WHERE id = ?`, values);

  return getStaffById(id);
}

// Delete staff user
async function deleteStaff(id) {
  await db.query("DELETE FROM staff_users WHERE id = ?", [id]);
  return true;
}

// Check if staff user is already blocked
async function getExistingBlock(userId) {
  const [rows] = await db.query(
    "SELECT id FROM user_blocks WHERE user_id = ? AND unblock_at IS NULL",
    [userId],
  );
  return rows[0] || null;
}

// Block staff from library access
async function blockStaff(userId, blockedBy, reason) {
  await db.query(
    "INSERT INTO user_blocks (user_id, blocked_by, reason, blocked_at) VALUES (?, ?, ?, NOW())",
    [userId, blockedBy, reason || "No reason provided"],
  );
  return true;
}

// Unblock staff member
async function unblockStaff(userId) {
  const [result] = await db.query(
    "UPDATE user_blocks SET unblock_at = NOW() WHERE user_id = ? AND unblock_at IS NULL",
    [userId],
  );
  return result.affectedRows;
}

// Get staff activity logs
async function getStaffActivity(staffId, limit = 50) {
  const [logs] = await db.query(
    `SELECT 
      al.id,
      al.user_id,
      al.action_type,
      al.description,
      al.*
    FROM activity_logs al
    WHERE al.user_id = ?
    ORDER BY al.* DESC
    LIMIT ?`,
    [staffId, limit]
  );
  return logs;
}

// Get staff attendance logs
async function getStaffAttendance(staffId, limit = 50) {
  const [logs] = await db.query(
    `SELECT 
      al.id,
      al.user_id,
      al.time_in,
      al.remarks,
      al.*
    FROM attendance_logs al
    WHERE al.user_id = ?
    ORDER BY al.time_in DESC
    LIMIT ?`,
    [staffId, limit]
  );
  return logs;
}

// Check if staff user is blocked
async function isStaffBlocked(userId) {
  const [rows] = await db.query(
    "SELECT * FROM user_blocks WHERE user_id = ? AND unblock_at IS NULL",
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getExistingBlock,
  blockStaff,
  unblockStaff,
  getStaffActivity,
  getStaffAttendance,
  isStaffBlocked,
};
