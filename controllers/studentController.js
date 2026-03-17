const studentService = require("../services/studentServices");

// Get all students with section info
const getAllStudents = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
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
        message: "Access denied. Only Management and Admin users can view all students.",
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const { rows, total } = await studentService.getAllStudents(limit, offset);
    res.status(200).json({
      success: true,
      data: rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching students",
    });
  }
};

const getStudentsBySection = async (req, res) => {
  try {
    const { section } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
    ;
    const rows = await studentService.getStudentsBySection(section, limit, offset);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching students by section:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching students by section",
    });
  }
};

const getStudentsByProgram = async (req, res) => {
  try {
    const { program } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset) : undefined;

   
    const rows = await studentService.getStudentsByProgram(program, limit, offset);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching students by program:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching students by program",
    });
  }
};


// Get single student by ID
const getStudentById = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    const student = await studentService.getStudentById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student",
    });
  }
};

// Create new student
const createStudent = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
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
        message: "Access denied. Only Management and Admin users can create students.",
      });
    }

    const {
      first_name, 
      last_name,
      password,
      status,
      section_id,
    } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "Please provide first_name and last_name",
      });
    }

    // section_id is required
    if (!section_id) {
      return res.status(400).json({
        success: false,
        message: "section_id is required. Please provide a valid section.",
      });
    }

    // Check if section exists
    const section = await studentService.getSectionById(section_id);
    if (!section) {
      return res.status(400).json({
        success: false,
        message: "Invalid section_id. Section does not exist.",
      });
    }

    // Generate email and check if email already exists
    const email = first_name.toLowerCase() + "." + last_name.toLowerCase() + "@neu.edu.ph";
    const existingEmail = await studentService.getStudentByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `A student with name ${first_name} ${last_name} already exists (${email}).`,
      });
    }

    const newStudent = await studentService.createStudent(
      first_name,
      last_name,
      password,
      section_id,
      status || "active"
    );

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: newStudent,
    });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({
      success: false,
      message: "Error creating student",
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
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
        message: "Access denied. Only Management and Admin users can update students.",
      });
    }

    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      password,
      qr_code,
      status,
    } = req.body;

    // Check if student exists
    const existingStudent = await studentService.getStudentByIdSimple(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const updatedStudent = await studentService.updateStudent(
      id,
      first_name,
      last_name,
      email,
      password,
      qr_code,
      status,
      req.body.section_id
    );

    if (!updatedStudent) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      message: "Error updating student",
    });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // Check if user has Admin (4) role only
    if (req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admin users can delete students.",
      });
    }

    const { id } = req.params;

    const existingStudent = await studentService.getStudentByIdSimple(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await studentService.deleteStudent(id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting student",
    });
  }
};

// Block student from library access
const blockStudent = async (req, res) => {
  try {
    // Check if user is authenticated and has proper role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    // Check if user has Librarian (2), Management (3) or Admin (4) role
    if (req.user.role_id !== 2 && req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Librarian, Management, and Admin users can block students.",
      });
    }

    const { id } = req.params;
    const reason = req.body?.reason;

    // Check if student exists
    const existingStudent = await studentService.getStudentByIdSimple(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if already blocked
    const existingBlock = await studentService.getExistingBlock(id);
    if (existingBlock) {
      return res.status(400).json({
        success: false,
        message: "Student is already blocked",
      });
    }

    await studentService.blockStudent(id, req.user.id, reason);

    res.status(200).json({
      success: true,
      message: "Student has been blocked from library access",
    });
  } catch (error) {
    console.error("Error blocking student:", error);
    res.status(500).json({
      success: false,
      message: "Error blocking student",
    });
  }
};

// Unblock student to allow library access
const unblockStudent = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    if (req.user.role_id !== 2 && req.user.role_id !== 3 && req.user.role_id !== 4) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Librarian, Management, and Admin users can unblock students.",
      });
    }

    const { id } = req.params;

    const existingStudent = await studentService.getStudentByIdSimple(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const affectedRows = await studentService.unblockStudent(id);

    if (affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Student is not currently blocked",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student has been unblocked and can now access the library",
    });
  } catch (error) {
    console.error("Error unblocking student:", error);
    res.status(500).json({
      success: false,
      message: "Error unblocking student",
    });
  }
};

// Get student activity logs
const getStudentActivity = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    const limit = parseInt(req.query.limit) || 50;
    const logs = await studentService.getStudentActivity(req.params.id, limit);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching student activity:", error);
    res.status(500).json({ success: false, message: "Error fetching activity logs" });
  }
};

// Get student attendance logs
const getStudentAttendance = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    const limit = parseInt(req.query.limit) || 50;
    const logs = await studentService.getStudentAttendance(req.params.id, limit);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance logs" });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  blockStudent,
  unblockStudent,
  getStudentActivity,
  getStudentAttendance,
  getStudentsBySection,
  getStudentsByProgram,
};
