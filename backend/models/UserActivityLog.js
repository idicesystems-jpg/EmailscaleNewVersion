const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const UserActivityLog = sequelize.define('UserActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  activity: {
    type: DataTypes.STRING, // e.g., "Sign In", "Sign Out"
    allowNull: false,
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resolution: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
  tableName: 'user_activity_logs',
  timestamps: false,
  underscored: true,
});

UserActivityLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = UserActivityLog;
