const db = require("../database");

// Get all programs
const getAllPrograms = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT p.*, c.college_name FROM programs p JOIN colleges c ON p.college_id = c.id ORDER BY c.college_name, p.program_name",
    );
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching programs",
    });
  }
};

// Get programs by college
const getProgramsByCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const [rows] = await db.query(
      "SELECT p.*, c.college_name FROM programs p JOIN colleges c ON p.college_id = c.id WHERE p.college_id = ? ORDER BY p.program_name",
      [collegeId],
    );
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching programs",
    });
  }
};

// Get single program by ID
const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT p.*, c.college_name FROM programs p JOIN colleges c ON p.college_id = c.id WHERE p.id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching program",
    });
  }
};

// Create new program
const createProgram = async (req, res) => {
  try {
    const { college_id, program_name, program_code, description } = req.body;

    if (!college_id || !program_name) {
      return res.status(400).json({
        success: false,
        message: "Please provide college_id and program_name",
      });
    }

    const [result] = await db.query(
      "INSERT INTO programs (college_id, program_name, program_code, description) VALUES (?, ?, ?, ?)",
      [college_id, program_name, program_code || null, description || null],
    );

    const [newProgram] = await db.query("SELECT * FROM programs WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      data: newProgram[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating program",
    });
  }
};

// Update program
const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { college_id, program_name, program_code, description, status } =
      req.body;

    const [existing] = await db.query("SELECT * FROM programs WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    const updates = [];
    const values = [];

    if (college_id) {
      updates.push("college_id = ?");
      values.push(college_id);
    }
    if (program_name) {
      updates.push("program_name = ?");
      values.push(program_name);
    }
    if (program_code !== undefined) {
      updates.push("program_code = ?");
      values.push(program_code);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
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
      `UPDATE programs SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [updatedProgram] = await db.query(
      "SELECT * FROM programs WHERE id = ?",
      [id],
    );

    res.status(200).json({
      success: true,
      message: "Program updated successfully",
      data: updatedProgram[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating program",
    });
  }
};

// Delete program
const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT * FROM programs WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    await db.query("DELETE FROM programs WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Program deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting program",
    });
  }
};

module.exports = {
  getAllPrograms,
  getProgramsByCollege,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
};
