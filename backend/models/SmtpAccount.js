// models/SmtpAccount.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');// adjust path if needed

const SmtpAccount = sequelize.define('SmtpAccount', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  from_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  from_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  smtp_host: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  smtp_port: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  smtp_secure: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  smtp_user: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  smtp_pass: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  daily_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 40,
  },
  sent_today: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sent_today_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  last_verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'smtp_accounts',
  timestamps: false, // disable default createdAt/updatedAt
});


module.exports = SmtpAccount;
