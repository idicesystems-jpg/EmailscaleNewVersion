// models/AdminNote.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path if needed
const User = require('./User');

const AdminNote = sequelize.define('AdminNote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
  tableName: 'admin_notes',
  timestamps: false,           // manually handled created_at & updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});


AdminNote.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

AdminNote.belongsTo(User, {
  foreignKey: 'assigned_to',
  as: 'assignee',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});


module.exports = AdminNote;
