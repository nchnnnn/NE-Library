const db = require("../database");

// Get all colleges
const getAllColleges = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM colleges ORDER BY college_name",
    );
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching colleges",
    });
  }
};

// Get single college by ID
const getCollegeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM colleges WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching college",
    });
  }
};

// Create new college
const createCollege = async (req, res) => {
  try {
    const { college_name, college_code, description } = req.body;

    if (!college_name) {
      return res.status(400).json({
        success: false,
        message: "Please provide college_name",
      });
    }

    const [result] = await db.query(
      "INSERT INTO colleges (college_name, college_code, description) VALUES (?, ?, ?)",
      [college_name, college_code || null, description || null],
    );

    const [newCollege] = await db.query("SELECT * FROM colleges WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "College created successfully",
      data: newCollege[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating college",
    });
  }
};

// Update college
const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { college_name, college_code, description, status } = req.body;

    const [existing] = await db.query("SELECT * FROM colleges WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    const updates = [];
    const values = [];

    if (college_name) {
      updates.push("college_name = ?");
      values.push(college_name);
    }
    if (college_code !== undefined) {
      updates.push("college_code = ?");
      values.push(college_code);
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
      `UPDATE colleges SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [updatedCollege] = await db.query(
      "SELECT * FROM colleges WHERE id = ?",
      [id],
    );

    res.status(200).json({
      success: true,
      message: "College updated successfully",
      data: updatedCollege[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating college",
    });
  }
};

// Delete college
const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT * FROM colleges WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    await db.query("DELETE FROM colleges WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "College deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting college",
    });
  }
};

module.exports = {
  getAllColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
};
