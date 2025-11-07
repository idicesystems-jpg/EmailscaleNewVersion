// models/ProviderAccount.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path if needed

const ProviderAccount = sequelize.define('ProviderAccount', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  provider: {
    type: DataTypes.ENUM('gmail', 'yahoo', 'aol', 'outlook', 'other'),
    defaultValue: 'other',
  },
  imap_host: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  imap_port: {
    type: DataTypes.INTEGER,
    defaultValue: 993,
  },
  imap_secure: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  imap_user: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  imap_pass: {
    type: DataTypes.TEXT,
    allowNull: false, // encrypted
  },
  smtp_host: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  smtp_port: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  smtp_secure: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  smtp_user: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  smtp_pass: {
    type: DataTypes.TEXT,
    allowNull: true, // encrypted
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
  tableName: 'provider_accounts',
  timestamps: false, // disable Sequelize auto timestamps
});

module.exports = ProviderAccount;
