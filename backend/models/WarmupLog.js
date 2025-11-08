// models/WarmupLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path if needed



const WarmupLog = sequelize.define('WarmupLog', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  token: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  from_smtp_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  to_provider_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  message_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('sent', 'received', 'replied', 'failed'),
    defaultValue: 'sent',
  },
  spam_folder: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
  },
  mailbox: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reply_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'warmup_logs',
  timestamps: false, // disable Sequelize auto timestamps
  indexes: [
    { fields: ['token'] },
    { fields: ['from_smtp_id'] },
    { fields: ['to_provider_id'] },
  ],
  
});

const SmtpAccount = require('./SmtpAccount');
const ProviderAccount = require('./ProviderAccount');

WarmupLog.belongsTo(SmtpAccount, {
  foreignKey: 'from_smtp_id',
  as: 'smtp_account',
});

WarmupLog.belongsTo(ProviderAccount, {
  foreignKey: 'to_provider_id',
  as: 'provider_account',
});



module.exports = WarmupLog;
