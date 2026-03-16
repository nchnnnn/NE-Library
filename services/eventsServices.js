const db = require("../database");

async function getEvents(limit = 10, offset = 0){
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM events`);
    
    let query = `SELECT e.*, 
            CONCAT(s.first_name, ' ', s.last_name) as created_by_name,
            s.email as created_by_email
       FROM events e 
       LEFT JOIN staff_users s ON e.created_by = s.id 
       ORDER BY e.start_datetime DESC
       LIMIT ? OFFSET ?`;

    const [rows] = await db.query(query, [Number(limit), Number(offset)]);
    return { rows, total };
}

async function getActiveEvents() {
    const now = new Date();
    const [result] = await db.query(
      `SELECT * FROM events 
       WHERE start_datetime <= ? AND end_datetime >= ?
       ORDER BY start_datetime ASC`,
      [now, now]
    );
    return result;
}

async function getUpcomingEvents() {
    const now = new Date();
    const [result] = await db.query(
      `SELECT * FROM events 
       WHERE start_datetime > ?
       ORDER BY start_datetime ASC
       LIMIT 10`,
      [now]
    );
    return result;
}

async function getEventById(id) {
    const [result] = await db.query(
      `SELECT e.*, 
              CONCAT(s.first_name, ' ', s.last_name) as created_by_name
       FROM events e 
       LEFT JOIN staff_users s ON e.created_by = s.id
       WHERE e.id = ?`,
      [id]
    );

    return result
}

async function createEvent(title, description, start_datetime, end_datetime, createdBy) {
    const [result] = await db.query(
      `INSERT INTO events (title, description, start_datetime, end_datetime, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || title, start_datetime, end_datetime, createdBy]
    );

    return result;
    
}


async function updateEvent(id, title, description, start_datetime, end_datetime) {
    // Dynamic field building — only update provided fields
    const updates = [];
    const values = [];

    if (title !== undefined) {
        updates.push("title = ?");
        values.push(title);
    }
    if (description !== undefined) {
        updates.push("description = ?");
        values.push(description);
    }
    if (start_datetime !== undefined) {
        updates.push("start_datetime = ?");
        values.push(start_datetime);
    }
    if (end_datetime !== undefined) {
        updates.push("end_datetime = ?");
        values.push(end_datetime);
    }

    if (updates.length === 0) {
        return null;
    }

    values.push(id);

    const [result] = await db.query(
        `UPDATE events SET ${updates.join(", ")} WHERE id = ?`,
        values
    );
    return result;
}

async function isExisting(id){
    const [result] = await db.query("SELECT * FROM events WHERE id = ?", [id]);
    return result
}


async function deleteEvent(id){
    const [result] = await db.query("DELETE FROM events WHERE id = ?", [id]);
    return result;
}


module.exports = {
    getEvents,
    createEvent,
    getActiveEvents,
    getUpcomingEvents,
    getEventById,
    updateEvent,
    isExisting,
    deleteEvent
    
}