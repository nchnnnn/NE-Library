const db = require("../database");
const eventService = require("../services/eventsServices");

// Get all events (for Management/Admin)
const getAllEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const { rows, total } = await eventService.getEvents(limit, offset);

    res.json({
      success: true,
      data: rows,
      total,
      limit,
      offset,
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
    const events = await eventService.getActiveEvents();
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
    const events = await eventService.getUpcomingEvents();
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
    const events = await eventService.getEventById(id);

    if (!events || events.length === 0) {
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
    const { title, description, start_datetime, end_datetime } = req.body;

    // Validation
    if (!title || !start_datetime || !end_datetime) {
      return res.status(400).json({
        success: false,
        message: "Title, start_datetime, and end_datetime are required",
      });
    }

    // Check if end_datetime is after start_datetime
    if (new Date(end_datetime) <= new Date(start_datetime)) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const result = await eventService.createEvent(
      title,
      description,
      start_datetime,
      end_datetime,
      req.user.id
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
    const { title, description, start_datetime, end_datetime } = req.body;

    // Check if event exists
    const existing = await eventService.isExisting(id);

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Validation
    if (end_datetime && start_datetime && new Date(end_datetime) <= new Date(start_datetime)) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    await eventService.updateEvent(id, title, description, start_datetime, end_datetime);

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
    const existing = await eventService.isExisting(id);

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    await eventService.deleteEvent(id);

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
