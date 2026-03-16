const db = require("../database");
const { generateEmployeeId } = require("../middleware/generateEmployeeId");
const { hashPassword, comparePassword } = require("../middleware/hashPassword");
const { generateUUID } = require("../middleware/generateUUID");
const { generateToken } = require("../middleware/generateToken");

// Find staff user by email
async function findStaffByEmail(email) {
    const [users] = await db.query("SELECT * FROM staff_users WHERE TRIM(email) = ?", [email.trim()]);
    return users[0] || null;
}

// Find staff user by employee_id
async function findStaffByEmployeeId(employeeId) {
    const [users] = await db.query("SELECT * FROM staff_users WHERE employee_id = ?", [employeeId]);
    return users[0] || null;
}

// Find staff user by id (includes password for change-password verification)
async function findStaffById(id) {
    const [users] = await db.query(
        "SELECT st.id, st.first_name, st.last_name, st.email, st.password, st.role_id, r.role_name, st.employee_id, st.status FROM staff_users st, roles r WHERE st.id = ? AND st.role_id = r.id",
        [id]
    );
    return users[0] || null;
}

// Get role name by id
async function getRoleName(roleId) {
    const [roles] = await db.query("SELECT role_name FROM roles WHERE id = ?", [roleId]);
    return roles.length > 0 ? roles[0].role_name : "unknown";
}

// Check if email already exists
async function checkEmailExists(email) {
    const [users] = await db.query(
        "SELECT id, first_name, last_name FROM staff_users WHERE email = ?",
        [email]
    );
    return users[0] || null;
}

// Check if employee_id already exists
async function checkEmployeeIdExists(employeeId) {
    const [users] = await db.query(
        "SELECT * FROM staff_users WHERE employee_id = ?",  
        [employeeId]
    );
    return users[0] || null;
}

// Create new staff user
async function createStaffUser(role_id, employeeId, first_name, last_name, email, password) {
    const hashedPassword = hashPassword(password);
    
    const [result] = await db.query(
        "INSERT INTO staff_users (role_id, employee_id, first_name, last_name, email, password, qr_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
            role_id,
            employeeId,
            first_name,
            last_name,
            email,
            hashedPassword,
            generateUUID(),
            "active",
        ]
    );

    const [newUser] = await db.query("SELECT * FROM staff_users WHERE id = ?", [result.insertId]);
    return newUser[0];
}

// Update password
async function updatePassword(userId, newPassword) {
    const hashedPassword = hashPassword(newPassword);
    await db.query("UPDATE staff_users SET password = ? WHERE id = ?", [hashedPassword, userId]);
    return true;
}

// Find student by QR code
async function findStudentByQR(qrCode) {
    const [students] = await db.query(
        `SELECT s.id, s.student_number, s.first_name, s.last_name, s.status, sec.section_name, col.college_name
         FROM students s 
         LEFT JOIN sections sec ON s.section_id = sec.id 
         LEFT JOIN programs p ON sec.program_id = p.id
         LEFT JOIN colleges col ON p.college_id = col.id
         WHERE s.qr_code = ?`,
        [qrCode]
    );
    return students[0] || null;
}

// Find student by student number
async function findStudentByNumber(studentNumber) {
    const [students] = await db.query(
        `SELECT s.id, s.student_number, s.first_name, s.last_name, s.status, sec.section_name, col.college_name
         FROM students s 
         LEFT JOIN sections sec ON s.section_id = sec.id 
         LEFT JOIN programs p ON sec.program_id = p.id
         LEFT JOIN colleges col ON p.college_id = col.id
         WHERE s.student_number = ?`,
        [studentNumber]
    );
    return students[0] || null;
}

// Find student by email (for kiosk account login)
async function findStudentByEmail(email) {
    const [students] = await db.query(
        `SELECT s.id, s.student_number, s.first_name, s.last_name, s.email, s.password, s.status, sec.section_name, col.college_name
         FROM students s 
         LEFT JOIN sections sec ON s.section_id = sec.id 
         LEFT JOIN programs p ON sec.program_id = p.id
         LEFT JOIN colleges col ON p.college_id = col.id
         WHERE s.email = ?`,
        [email.trim()]
    );
    return students[0] || null;
}

// Find staff by QR code
async function findStaffByQR(qrCode) {
    const [staff] = await db.query(
        `SELECT s.id, s.employee_id, s.first_name, s.last_name, s.status, r.role_name
         FROM staff_users s LEFT JOIN roles r ON s.role_id = r.id WHERE s.qr_code = ?`,
        [qrCode]
    );
    return staff[0] || null;
}

// Check if user is blocked
async function isUserBlocked(userId) {
    const [blocks] = await db.query(
        "SELECT * FROM user_blocks WHERE user_id = ? AND unblock_at IS NULL", 
        [userId]
    );
    return blocks[0] || null;
}

// Log attendance
async function logAttendance(userId, remarks) {
    await db.query(
        "INSERT INTO attendance_logs (user_id, time_in, remarks) VALUES (?, NOW(), ?)",
        [userId, remarks]
    );
}

// Log activity (user_type: 'student'|'staff'|'admin', identifier: student_number or employee_id)
async function logActivity(userId, actionType, description, userType = null, identifier = null) {
    await db.query(
        "INSERT INTO activity_logs (user_id, user_type, identifier, action_type, description) VALUES (?, ?, ?, ?, ?)",
        [userId, userType, identifier, actionType, description]
    );
}

// Get active event
async function getActiveEvent() {
    const now = new Date();
    const [events] = await db.query(
        "SELECT * FROM events WHERE start_datetime <= ? AND end_datetime >= ? LIMIT 1", 
        [now, now]
    );
    return events[0] || null;
}

module.exports = {
  findStaffByEmail,
  findStaffByEmployeeId,
  findStaffById,
  getRoleName,
  checkEmailExists,
  checkEmployeeIdExists,
  createStaffUser,
  updatePassword,
  findStudentByQR,
  findStudentByNumber,
  findStudentByEmail,
  findStaffByQR,
  isUserBlocked,
  logAttendance,
  logActivity,
  getActiveEvent,
  comparePassword,
  generateToken,
  generateEmployeeId,
};
