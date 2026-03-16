const db = require("../database");

// Get all sections
async function getAllSections(limit, offset) {
    let query = "SELECT s.*, p.program_name, p.program_code, c.college_name FROM sections s JOIN programs p ON s.program_id = p.id JOIN colleges c ON p.college_id = c.id ORDER BY c.college_name, p.program_name, s.year_level, s.section_name";
    let queryParams = [];

    if (limit !== undefined && offset !== undefined) {
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(Number(limit), Number(offset));
    }

    const [rows] = await db.query(query, queryParams);
    return rows;
}

// Get sections by program
async function getSectionsByProgram(programId, limit, offset) {
    let query = "SELECT s.*, p.program_name, p.program_code FROM sections s JOIN programs p ON s.program_id = p.id WHERE s.program_id = ? ORDER BY s.year_level, s.section_name";
    let queryParams = [programId];

    if (limit !== undefined && offset !== undefined) {
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(Number(limit), Number(offset));
    }

    const [rows] = await db.query(query, queryParams);
    return rows;
}

// Get single section by ID
async function getSectionById(id) {
    const [rows] = await db.query(
        "SELECT s.*, p.program_name, p.program_code, c.college_name FROM sections s JOIN programs p ON s.program_id = p.id JOIN colleges c ON p.college_id = c.id WHERE s.id = ?",
        [id]
    );
    return rows[0] || null;
}

// Get section by ID simple (for checking existence)
async function getSectionByIdSimple(id) {
    const [rows] = await db.query("SELECT * FROM sections WHERE id = ?", [id]);
    return rows[0] || null;
}

// Create new section
async function createSection(program_id, section_name, year_level) {
    const [result] = await db.query(
        "INSERT INTO sections (program_id, section_name, year_level) VALUES (?, ?, ?)",
        [program_id, section_name, year_level]
    );

    const [newSection] = await db.query("SELECT * FROM sections WHERE id = ?", [
        result.insertId,
    ]);

    return newSection[0];
}

// Update section
async function updateSection(id, program_id, section_name, year_level) {
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
    if (year_level) {
        updates.push("year_level = ?");
        values.push(year_level);
    }

    if (updates.length === 0) {
        return null;
    }

    values.push(id);

    await db.query(
        `UPDATE sections SET ${updates.join(", ")} WHERE id = ?`,
        values
    );

    const [updatedSection] = await db.query(
        "SELECT * FROM sections WHERE id = ?",
        [id]
    );

    return updatedSection[0];
}

// Delete section
async function deleteSection(id) {
    await db.query("DELETE FROM sections WHERE id = ?", [id]);
    return true;
}

module.exports = {
    getAllSections,
    getSectionsByProgram,
    getSectionById,
    getSectionByIdSimple,
    createSection,
    updateSection,
    deleteSection,
};
