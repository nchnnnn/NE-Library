const collegeService = require("../services/collegeServices");

// Get all colleges
const getAllColleges = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
    
    const rows = await collegeService.getAllColleges(limit, offset);
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
    const college = await collegeService.getCollegeById(id);

    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    res.status(200).json({
      success: true,
      data: college,
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
    const { college_name } = req.body;

    if (!college_name) {
      return res.status(400).json({
        success: false,
        message: "Please provide college_name",
      });
    }

    const newCollege = await collegeService.createCollege(college_name);

    res.status(201).json({
      success: true,
      message: "College created successfully",
      data: newCollege,
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
    const { college_name } = req.body;

    const existing = await collegeService.getCollegeByIdSimple(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    const updatedCollege = await collegeService.updateCollege(id, college_name);

    if (!updatedCollege) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    res.status(200).json({
      success: true,
      message: "College updated successfully",
      data: updatedCollege,
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

    const existing = await collegeService.getCollegeByIdSimple(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    await collegeService.deleteCollege(id);

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
