const db = require("../database");

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
            roles.role_name
         FROM staff_users 
         LEFT JOIN roles ON staff_users.role_id = roles.id
         WHERE staff_users.id = ?`,
    [id],
  );
  return rows[0] ? sanitizeStaff(rows[0]) : null;
}

module.exports = {
  getAllStaff,
  getStaffById,
};
