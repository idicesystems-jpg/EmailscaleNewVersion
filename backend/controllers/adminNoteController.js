// controllers/adminNoteController.js
const AdminNote = require('../models/AdminNote');
const User = require('../models/User');
const AdminNoteReply = require('../models/AdminNoteReply');

const createNote = async (req, res) => {
  try {
    const { created_by, assigned_to, note } = req.body;

    // Check if creator is an admin
    const creator = await User.findOne({
      where: { id: created_by, role_id: [0, 1] },
    });

    if (!creator) {
      return res.status(403).json({
        status: false,
        message: 'Only admins (role_id = 1) can create notes.',
      });
    }

    const newNote = await AdminNote.create({
      created_by,
      assigned_to,
      note,
    });

    return res.status(201).json({
      status: true,
      message: 'Admin note created successfully.',
      data: newNote,
    });
  } catch (error) {
    console.error('Error creating admin note:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};


const getAllNotes = async (req, res) => {
  try {
    const notes = await AdminNote.findAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: AdminNoteReply, as: 'replies'}
      ],
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      status: true,
      message: 'Admin notes fetched successfully.',
      data: notes,
    });
  } catch (error) {
    console.error('Error fetching admin notes:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

const replyToNote = async (req, res) => {
  try {
    const { parent_id, created_by, note } = req.body;

    // Ensure only admin can reply
    const user = await User.findOne({ where: { id: created_by, role_id: 1 } });
    if (!user) {
      return res.status(403).json({
        status: false,
        message: 'Only admins (role_id = 1) can reply to notes.',
      });
    }

    // Check if parent note exists
    const parentNote = await AdminNote.findByPk(parent_id);
    if (!parentNote) {
      return res.status(404).json({
        status: false,
        message: 'Parent note not found.',
      });
    }

    // Create reply (just another note with parent_id)
    const reply = await AdminNote.create({
      parent_id,
      created_by,
      assigned_to: parentNote.assigned_to,
      note,
    });

    return res.status(201).json({
      status: true,
      message: 'Reply added successfully.',
      data: reply,
    });
  } catch (error) {
    console.error('Error replying to admin note:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

const addNoteAdminReply = async (req, res) => {
  try {
    const { note_id, user_id, reply_text } = req.body;

    // Validate required fields
    if (!note_id || !user_id || !reply_text) {
      return res.status(400).json({
        status: false,
        message: 'note_id, user_id, and reply_text are required',
      });
    }

    // Check user role (must be admin or superadmin)
    const user = await User.findOne({
      where: { id: user_id, role_id: [0, 1] },
    });

    if (!user) {
      return res.status(403).json({
        status: false,
        message: 'Only Admin or SuperAdmin can reply to notes',
      });
    }

    // Check if note exists
    const note = await AdminNote.findByPk(note_id);
    if (!note) {
      return res.status(404).json({
        status: false,
        message: 'Admin note not found',
      });
    }

    // Create reply
    const reply = await AdminNoteReply.create({
      note_id,
      user_id,
      reply_text,
    });

    res.status(201).json({
      status: true,
      message: 'Reply added successfully',
      data: reply,
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};


// ✅ Get all replies for a specific admin note
const getRepliesByNote = async (req, res) => {
  try {
    const { note_id } = req.params;

    const replies = await AdminNoteReply.findAll({
      where: { note_id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role_id']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    res.status(200).json({
      status: true,
      message: 'Replies fetched successfully',
      data: replies,
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

const deleteNoteWithReplies = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find note
    const note = await AdminNote.findByPk(id, { include: [{ model: AdminNoteReply, as: 'replies' }] });

    if (!note) {
      return res.status(404).json({ status: false, message: 'Note not found' });
    }

    // 2. Delete replies first (if any)
    await AdminNoteReply.destroy({ where: { note_id: id } });

    // 3. Delete the note itself
    await note.destroy();

    return res.json({
      status: true,
      message: 'Note and its replies deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};


const reassignNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({
        status: false,
        message: 'assigned_to field is required.',
      });
    }

    // Find the note
    const note = await AdminNote.findByPk(id);

    if (!note) {
      return res.status(404).json({
        status: false,
        message: 'Note not found.',
      });
    }

    // Update only assigned_to
    note.assigned_to = assigned_to;
    await note.save();

    return res.status(200).json({
      status: true,
      message: 'Note reassigned successfully.',
      data: note,
    });
  } catch (error) {
    console.error('Error reassigning note:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

const deleteNoteReply = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the reply by ID
    const reply = await AdminNoteReply.findByPk(id);

    if (!reply) {
      return res.status(404).json({
        status: false,
        message: 'Reply not found.',
      });
    }

    // Delete the reply
    await reply.destroy();

    return res.status(200).json({
      status: true,
      message: 'Reply deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};



module.exports = {
  createNote,
  getAllNotes,
  replyToNote,
  addNoteAdminReply,
  getRepliesByNote,
  deleteNoteWithReplies,
  reassignNote,
  deleteNoteReply
};
