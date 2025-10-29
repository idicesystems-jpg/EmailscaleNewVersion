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


module.exports = {
  createNote,
  getAllNotes,
  replyToNote,
  addNoteAdminReply,
  getRepliesByNote
};
