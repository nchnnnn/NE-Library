const sectionService = require("../services/sectionServices");

// Get all sections
const getAllSections = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
    
    const rows = await sectionService.getAllSections(limit, offset);
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
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
    
    const rows = await sectionService.getSectionsByProgram(programId, limit, offset);
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
    const section = await sectionService.getSectionById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    res.status(200).json({
      success: true,
      data: section,
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
    const { program_id, section_name, year_level } = req.body;

    if (!program_id || !section_name || !year_level) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide program_id, section_name, and year_level",
      });
    }

    const newSection = await sectionService.createSection(program_id, section_name, year_level);

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: newSection,
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
    const { program_id, section_name, year_level } = req.body;

    const existing = await sectionService.getSectionByIdSimple(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const updatedSection = await sectionService.updateSection(id, program_id, section_name, year_level);

    if (!updatedSection) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
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

    const existing = await sectionService.getSectionByIdSimple(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    await sectionService.deleteSection(id);

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
