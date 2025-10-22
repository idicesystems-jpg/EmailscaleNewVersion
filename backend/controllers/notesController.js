const { Op } = require('sequelize');
const TicketNote = require('../models/TicketNote')
const User = require('../models/User');

const addNote = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const userId = req.user.id; // Admin or user adding note
    const { note } = req.body;

    if (!note || !ticketId) {
      return res.status(400).json({ message: "Ticket ID and note text are required" });
    }

    const newNote = await TicketNote.create({
      ticket_id: ticketId,
      user_id: userId,
      note: note,
    });

    res.json({ message: "Note added successfully", note_id: newNote.id });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ message: "Failed to add note", error: error.message });
  }
};


const getNotes = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    if (!ticketId) {
      return res.status(400).json({ message: "Ticket ID is required" });
    }

    const notes = await TicketNote.findAll({
      where: { ticket_id: ticketId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'], // get only name
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Format response to include user_name directly
    const formattedNotes = notes.map(n => ({
      id: n.id,
      ticket_id: n.ticket_id,
      user_id: n.user_id,
      note: n.note,
      created_at: n.created_at,
      user_name: n.user ? n.user.name : null,
    }));

    res.json({ notes: formattedNotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notes", error: error.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const userId = req.user.id; // Only note owner can update
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ message: "Note text is required" });
    }

    const [updated] = await TicketNote.update(
      { note },
      {
        where: {
          id: noteId,
          user_id: userId,
        },
      }
    );

    if (!updated) {
      return res.status(404).json({ message: "Note not found or not yours to edit" });
    }

    res.json({ message: "Note updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update note", error: error.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const userId = req.user.id;

    const deleted = await TicketNote.destroy({
      where: {
        id: noteId,
        user_id: userId,
      },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Note not found or not yours to delete" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete note", error: error.message });
  }
};

module.exports = {addNote, getNotes, updateNote, deleteNote}