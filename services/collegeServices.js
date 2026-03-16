const db = require("../database");

// Get all colleges
async function getAllColleges(limit, offset) {
    let query = "SELECT * FROM colleges ORDER BY college_name";
    let queryParams = [];

    if (limit !== undefined && offset !== undefined) {
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(Number(limit), Number(offset));
    }

    const [rows] = await db.query(query, queryParams);
    return rows;
}

// Get single college by ID
async function getCollegeById(id) {
    const [rows] = await db.query("SELECT * FROM colleges WHERE id = ?", [id]);
    return rows[0] || null;
}

// Get college by ID simple (for checking existence)
async function getCollegeByIdSimple(id) {
    const [rows] = await db.query("SELECT * FROM colleges WHERE id = ?", [id]);
    return rows[0] || null;
}

// Create new college
async function createCollege(college_name) {
    const [result] = await db.query(
        "INSERT INTO colleges (college_name) VALUES (?)",
        [college_name]
    );

    const [newCollege] = await db.query("SELECT * FROM colleges WHERE id = ?", [
        result.insertId,
    ]);

    return newCollege[0];
}

// Update college
async function updateCollege(id, college_name) {
    const updates = [];
    const values = [];

    if (college_name) {
        updates.push("college_name = ?");
        values.push(college_name);
    }

    if (updates.length === 0) {
        return null;
    }

    values.push(id);

    await db.query(
        `UPDATE colleges SET ${updates.join(", ")} WHERE id = ?`,
        values
    );

    const [updatedCollege] = await db.query(
        "SELECT * FROM colleges WHERE id = ?",
        [id]
    );

    return updatedCollege[0];
}

// Delete college
async function deleteCollege(id) {
    await db.query("DELETE FROM colleges WHERE id = ?", [id]);
    return true;
}

module.exports = {
    getAllColleges,
    getCollegeById,
    getCollegeByIdSimple,
    createCollege,
    updateCollege,
    deleteCollege,
};
