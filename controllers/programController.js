const programService = require("../services/programServices");

// Get all programs
const getAllPrograms = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
    
    const rows = await programService.getAllPrograms(limit, offset);
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
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
    
    const rows = await programService.getProgramsByCollege(collegeId, limit, offset);
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
    const program = await programService.getProgramById(id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    res.status(200).json({
      success: true,
      data: program,
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
    const { college_id, program_name, program_code } = req.body;

    if (!college_id || !program_name) {
      return res.status(400).json({
        success: false,
        message: "Please provide college_id and program_name",
      });
    }

    const newProgram = await programService.createProgram(college_id, program_name, program_code);

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      data: newProgram,
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
    const { college_id, program_name, program_code } = req.body;

    const existing = await programService.getProgramByIdSimple(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    const updatedProgram = await programService.updateProgram(id, college_id, program_name, program_code);

    if (!updatedProgram) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    res.status(200).json({
      success: true,
      message: "Program updated successfully",
      data: updatedProgram,
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

    const existing = await programService.getProgramByIdSimple(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    await programService.deleteProgram(id);

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
