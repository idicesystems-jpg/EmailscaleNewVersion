// models/AdminNoteReply.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust if your DB file is elsewhere
const AdminNote = require('./AdminNote');
const User = require('./User');

const AdminNoteReply = sequelize.define('AdminNoteReply', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  note_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reply_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'admin_note_replies',
  timestamps: false, // since you only have created_at (no updated_at)
  underscored: true
});

// Associations
AdminNoteReply.belongsTo(AdminNote, {
  foreignKey: 'note_id',
  as: 'note'
});

AdminNoteReply.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

AdminNote.hasMany(AdminNoteReply, {
  foreignKey: 'note_id',
  as: 'replies'
});


module.exports = AdminNoteReply;
