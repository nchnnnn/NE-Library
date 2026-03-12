const db = require("../database");

// Get all events (for Management/Admin)
const getAllEvents = async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.*, 
              CONCAT(s.first_name, ' ', s.last_name) as created_by_name,
              s.email as created_by_email
       FROM events e 
       LEFT JOIN staff_users s ON e.created_by = s.id 
       ORDER BY e.start_time DESC`
    );

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching events",
    });
  }
};

// Get active events (currently ongoing)
const getActiveEvents = async (req, res) => {
  try {
    const now = new Date();
    const [events] = await db.query(
      `SELECT * FROM events 
       WHERE start_time <= ? AND end_time >= ?
       ORDER BY start_time ASC`,
      [now, now]
    );

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching active events:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active events",
    });
  }
};

// Get upcoming events
const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const [events] = await db.query(
      `SELECT * FROM events 
       WHERE start_time > ?
       ORDER BY start_time ASC
       LIMIT 10`,
      [now]
    );

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching upcoming events",
    });
  }
};

// Get single event by ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const [events] = await db.query(
      `SELECT e.*, 
              CONCAT(s.first_name, ' ', s.last_name) as created_by_name
       FROM events e 
       LEFT JOIN staff_users s ON e.created_by = s.id
       WHERE e.id = ?`,
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: events[0],
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching event",
    });
  }
};

// Create new event (Management/Admin only)
const createEvent = async (req, res) => {
  try {
    const { title, description, start_time, end_time } = req.body;

    // Validation
    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "Title, start_time, and end_time are required",
      });
    }

    // Check if end_time is after start_time
    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const [result] = await db.query(
      `INSERT INTO events (title, description, start_time, end_time, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || null, start_time, end_time, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Error creating event",
    });
  }
};

// Update event (Management/Admin only)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start_time, end_time } = req.body;

    // Check if event exists
    const [existing] = await db.query("SELECT * FROM events WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Validation
    if (end_time && start_time && new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    await db.query(
      `UPDATE events 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           start_time = COALESCE(?, start_time),
           end_time = COALESCE(?, end_time)
       WHERE id = ?`,
      [title, description, start_time, end_time, id]
    );

    res.json({
      success: true,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "Error updating event",
    });
  }
};

// Delete event (Management/Admin only)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const [existing] = await db.query("SELECT * FROM events WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    await db.query("DELETE FROM events WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting event",
    });
  }
};

module.exports = {
  getAllEvents,
  getActiveEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
