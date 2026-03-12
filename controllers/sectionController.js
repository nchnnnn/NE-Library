const db = require("../database");

// Get all sections
const getAllSections = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT s.*, p.program_name, p.program_code, c.college_name FROM sections s JOIN programs p ON s.program_id = p.id JOIN colleges c ON p.college_id = c.id ORDER BY c.college_name, p.program_name, s.section_year, s.section_name",
    );
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sections",
    });
  }
};

// Get sections by program
const getSectionsByProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const [rows] = await db.query(
      "SELECT s.*, p.program_name, p.program_code FROM sections s JOIN programs p ON s.program_id = p.id WHERE s.program_id = ? ORDER BY s.section_year, s.section_name",
      [programId],
    );
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sections",
    });
  }
};

// Get single section by ID
const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT s.*, p.program_name, p.program_code, c.college_name FROM sections s JOIN programs p ON s.program_id = p.id JOIN colleges c ON p.college_id = c.id WHERE s.id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching section",
    });
  }
};

// Create new section
const createSection = async (req, res) => {
  try {
    const { program_id, section_name, section_year, academic_year, semester } =
      req.body;

    if (
      !program_id ||
      !section_name ||
      !section_year ||
      !academic_year ||
      !semester
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide program_id, section_name, section_year, academic_year, and semester",
      });
    }

    const [result] = await db.query(
      "INSERT INTO sections (program_id, section_name, section_year, academic_year, semester) VALUES (?, ?, ?, ?, ?)",
      [program_id, section_name, section_year, academic_year, semester],
    );

    const [newSection] = await db.query("SELECT * FROM sections WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: newSection[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating section",
    });
  }
};

// Update section
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      program_id,
      section_name,
      section_year,
      academic_year,
      semester,
      status,
    } = req.body;

    const [existing] = await db.query("SELECT * FROM sections WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const updates = [];
    const values = [];

    if (program_id) {
      updates.push("program_id = ?");
      values.push(program_id);
    }
    if (section_name) {
      updates.push("section_name = ?");
      values.push(section_name);
    }
    if (section_year) {
      updates.push("section_year = ?");
      values.push(section_year);
    }
    if (academic_year) {
      updates.push("academic_year = ?");
      values.push(academic_year);
    }
    if (semester) {
      updates.push("semester = ?");
      values.push(semester);
    }
    if (status) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    values.push(id);

    await db.query(
      `UPDATE sections SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [updatedSection] = await db.query(
      "SELECT * FROM sections WHERE id = ?",
      [id],
    );

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating section",
    });
  }
};

// Delete section
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT * FROM sections WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    await db.query("DELETE FROM sections WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting section",
    });
  }
};

module.exports = {
  getAllSections,
  getSectionsByProgram,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
};
