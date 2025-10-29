// models/Ticket.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path if needed
const User = require('./User');
const { assign } = require('nodemailer/lib/shared');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low','medium','high'),
    allowNull: false,
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('open','closed','delete'),
    allowNull: false,
    defaultValue: 'open'
  },
  file: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  rating: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
   updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
}, {
  tableName: 'tickets',
  timestamps: false,
  createdAt: 'created_at',        // map Sequelize's createdAt to created_at
  updatedAt: 'updated_at'
});

Ticket.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
});

module.exports = Ticket;