const db = require("../database");

// Get all programs
async function getAllPrograms(limit, offset) {
    let query = "SELECT p.*, c.college_name FROM programs p JOIN colleges c ON p.college_id = c.id ORDER BY c.college_name, p.program_name";
    let queryParams = [];

    if (limit !== undefined && offset !== undefined) {
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(Number(limit), Number(offset));
    }

    const [rows] = await db.query(query, queryParams);
    return rows;
}

// Get programs by college
async function getProgramsByCollege(collegeId, limit, offset) {
    let query = "SELECT p.*, c.college_name FROM programs p JOIN colleges c ON p.college_id = c.id WHERE p.college_id = ? ORDER BY p.program_name";
    let queryParams = [collegeId];

    if (limit !== undefined && offset !== undefined) {
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(Number(limit), Number(offset));
    }

    const [rows] = await db.query(query, queryParams);
    return rows;
}

// Get single program by ID
async function getProgramById(id) {
    const [rows] = await db.query(
        "SELECT p.*, c.college_name FROM programs p JOIN colleges c ON p.college_id = c.id WHERE p.id = ?",
        [id]
    );
    return rows[0] || null;
}

// Get program by ID simple (for checking existence)
async function getProgramByIdSimple(id) {
    const [rows] = await db.query("SELECT * FROM programs WHERE id = ?", [id]);
    return rows[0] || null;
}

// Create new program
async function createProgram(college_id, program_name, program_code) {
    const [result] = await db.query(
        "INSERT INTO programs (college_id, program_name, program_code) VALUES (?, ?, ?)",
        [college_id, program_name, program_code || null]
    );

    const [newProgram] = await db.query("SELECT * FROM programs WHERE id = ?", [
        result.insertId,
    ]);

    return newProgram[0];
}

// Update program
async function updateProgram(id, college_id, program_name, program_code) {
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

    if (updates.length === 0) {
        return null;
    }

    values.push(id);

    await db.query(
        `UPDATE programs SET ${updates.join(", ")} WHERE id = ?`,
        values
    );

    const [updatedProgram] = await db.query(
        "SELECT * FROM programs WHERE id = ?",
        [id]
    );

    return updatedProgram[0];
}

// Delete program
async function deleteProgram(id) {
    await db.query("DELETE FROM programs WHERE id = ?", [id]);
    return true;
}

module.exports = {
    getAllPrograms,
    getProgramsByCollege,
    getProgramById,
    getProgramByIdSimple,
    createProgram,
    updateProgram,
    deleteProgram,
};
