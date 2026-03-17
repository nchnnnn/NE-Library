const db = require("../database");
const { generateUUID } = require("../middleware/qrGenerate");
const { generateStudentNumber } = require("../middleware/generateStudentNum");
const { hashPassword } = require("../middleware/hashPassword");

// Helper: Remove sensitive fields from student object
function sanitizeStudent(student) {
  if (!student) return null;
  const { password, qr_code, ...safe } = student;
  return safe;
}

// Helper: Remove sensitive fields from array of students
function sanitizeStudents(students) {
  return students.map(sanitizeStudent);
}

// Get all students with section, program, college info (paginated)
async function getAllStudents(limit = 10, offset = 0) {
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM students`,
  );

  const [rows] = await db.query(
    `SELECT 
            students.id,
            students.student_number, 
            students.first_name, 
            students.last_name, 
            students.email, 
            students.profile_image,
            students.status, 
            students.created_at,
            sections.section_name,
            programs.program_name,
            colleges.college_name
         FROM students 
         LEFT JOIN sections ON students.section_id = sections.id
         LEFT JOIN programs ON sections.program_id = programs.id
         LEFT JOIN colleges ON programs.college_id = colleges.id
         ORDER BY students.id DESC
         LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)],
  );
  return { rows: sanitizeStudents(rows), total };
}

// Get students by section
async function getStudentsBySection(sectionId, limit, offset) {
  let query = `SELECT 
        s.id,
        s.student_number, 
        s.first_name, 
        s.last_name, 
        s.email, 
        s.profile_image,
        s.status,
        s.created_at,
        sec.section_name,
        p.program_name,
        col.college_name
     FROM students s
     LEFT JOIN sections sec ON s.section_id = sec.id
     LEFT JOIN programs p ON sec.program_id = p.id
     LEFT JOIN colleges col ON p.college_id = col.id
     WHERE sec.id = ?`;
  let queryParams = [sectionId];

  if (limit !== undefined && offset !== undefined) {
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(Number(limit), Number(offset));
  }

  const [rows] = await db.query(query, queryParams);
  return sanitizeStudents(rows);
}

// Get students by program
async function getStudentsByProgram(programId, limit, offset) {
  let query = `SELECT 
        s.id,
        s.student_number, 
        s.first_name, 
        s.last_name, 
        s.email, 
        s.profile_image,
        s.status,
        s.created_at,
        sec.section_name,
        p.program_name,
        col.college_name
     FROM students s
     LEFT JOIN sections sec ON s.section_id = sec.id
     LEFT JOIN programs p ON sec.program_id = p.id
     LEFT JOIN colleges col ON p.college_id = col.id
     WHERE p.id = ?`;
  let queryParams = [programId];

  if (limit !== undefined && offset !== undefined) {
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(Number(limit), Number(offset));
  }

  const [rows] = await db.query(query, queryParams);
  return sanitizeStudents(rows);
}

// Get single student by ID with full details
async function getStudentById(id) {
  const [rows] = await db.query(
    `SELECT 
            students.id,
            students.student_number, 
            students.first_name, 
            students.last_name, 
            students.email, 
            students.profile_image,
            students.status, 
            students.created_at,
            students.section_id,
            sections.section_name,
            programs.program_name,
            colleges.college_name
         FROM students 
         LEFT JOIN sections ON students.section_id = sections.id
         LEFT JOIN programs ON sections.program_id = programs.id
         LEFT JOIN colleges ON programs.college_id = colleges.id
         WHERE students.id = ?`,
    [id],
  );
  return rows[0] ? sanitizeStudent(rows[0]) : null;
}

// Check if section exists
async function getSectionById(sectionId) {
  const [rows] = await db.query(
    "SELECT id, section_name FROM sections WHERE id = ?",
    [sectionId],
  );
  return rows[0] || null;
}

// Check if email already exists
async function getStudentByEmail(email) {
  const [rows] = await db.query(
    "SELECT id, first_name, last_name FROM students WHERE email = ?",
    [email],
  );
  return rows[0] || null;
}

// Create new student
async function createStudent(
  first_name,
  last_name,
  password,
  section_id,
  status = "active",
) {
  const email =
    first_name.toLowerCase() + "." + last_name.toLowerCase() + "@neu.edu.ph";
  const student_number = await generateStudentNumber();
  const hashedPassword = password
    ? hashPassword(password)
    : hashPassword(first_name.toLowerCase() + "." + last_name.toLowerCase());

  const [result] = await db.query(
    "INSERT INTO students (student_number, first_name, last_name, email, password, qr_code, section_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      student_number,
      first_name,
      last_name,
      email,
      hashedPassword,
      generateUUID(),
      section_id,
      status,
    ],
  );

  const [newStudent] = await db.query(
    `SELECT id, student_number, first_name, last_name, email, profile_image, status, created_at, section_id
     FROM students WHERE id = ?`,
    [result.insertId]
  );

  return sanitizeStudent(newStudent[0]);
}

// Get student by ID for update
async function getStudentByIdSimple(id) {
  const [rows] = await db.query("SELECT * FROM students WHERE id = ?", [id]);
  return rows[0] || null;
}

// Update student
async function updateStudent(
  id,
  first_name,
  last_name,
  email,
  password,
  qr_code,
  status,
  section_id,
) {
  const updates = [];
  const values = [];

  if (first_name !== undefined) {
    updates.push("first_name = ?");
    values.push(first_name);
  }
  if (last_name !== undefined) {
    updates.push("last_name = ?");
    values.push(last_name);
  }
  if (email !== undefined) {
    updates.push("email = ?");
    values.push(email);
  }
  if (password !== undefined && password !== "") {
    updates.push("password = ?");
    values.push(hashPassword(password));
  }
  if (qr_code !== undefined) {
    updates.push("qr_code = ?");
    values.push(qr_code);
  }
  if (status !== undefined) {
    updates.push("status = ?");
    values.push(status);
  }
  if (section_id !== undefined) {
    updates.push("section_id = ?");
    values.push(section_id);
  }

  if (updates.length === 0) {
    return null;
  }

  values.push(id);

  await db.query(
    `UPDATE students SET ${updates.join(", ")} WHERE id = ?`,
    values,
  );

  const [updatedStudent] = await db.query(
    "SELECT * FROM students WHERE id = ?",
    [id],
  );
  return sanitizeStudent(updatedStudent[0]);
}

// Delete student
async function deleteStudent(id) {
  await db.query("DELETE FROM students WHERE id = ?", [id]);
  return true;
}

// Check if student is already blocked
async function getExistingBlock(userId) {
  const [rows] = await db.query(
    "SELECT id FROM user_blocks WHERE user_id = ? AND unblock_at IS NULL",
    [userId],
  );
  return rows[0] || null;
}

// Block student from library access
async function blockStudent(userId, blockedBy, reason) {
  await db.query(
    "INSERT INTO user_blocks (user_id, blocked_by, reason, blocked_at) VALUES (?, ?, ?, NOW())",
    [userId, blockedBy, reason || "No reason provided"],
  );
  return true;
}

// Unblock student
async function unblockStudent(userId) {
  const [result] = await db.query(
    "UPDATE user_blocks SET unblock_at = NOW() WHERE user_id = ? AND unblock_at IS NULL",
    [userId],
  );
  return result.affectedRows;
}

// Get student activity logs
async function getStudentActivity(studentId, limit = 50) {
  const [logs] = await db.query(
    `SELECT 
      al.id,
      al.user_id,
      al.action_type,
      al.description,
      al.created_at
    FROM activity_logs al
    WHERE al.user_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?`,
    [studentId, limit]
  );
  return logs;
}

// Get student attendance logs
async function getStudentAttendance(studentId, limit = 50) {
  const [logs] = await db.query(
    `SELECT 
      al.id,
      al.user_id,
      al.time_in,
      al.remarks,
      al.created_at
    FROM attendance_logs al
    WHERE al.user_id = ?
    ORDER BY al.time_in DESC
    LIMIT ?`,
    [studentId, limit]
  );
  return logs;
}

module.exports = {
  getAllStudents,
  getStudentsBySection,
  getStudentsByProgram,
  getStudentById,
  getSectionById,
  getStudentByEmail,
  createStudent,
  getStudentByIdSimple,
  updateStudent,
  deleteStudent,
  getExistingBlock,
  blockStudent,
  unblockStudent,
  getStudentActivity,
  getStudentAttendance,
};
