// models/TicketNote.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path
const User = require('./User');
const Ticket = require('./Ticket');

const TicketNote = sequelize.define('TicketNote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
}, {
  tableName: 'ticket_notes',
  timestamps: false,
  createdAt: 'created_at',
});

// Associations
TicketNote.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
TicketNote.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = TicketNote;
