// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path to your sequelize instance

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payment_status: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  role_id: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  remember_token: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  emailscale_token: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  email_tool: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: true,
  },
  domains_tool: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: true,
  },
  warm_up_tool: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: true,
  },
  ghl_tool: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: true,
    defaultValue: 0,
  },
  ghl_apikey: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ghl_refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contact_details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  google2fa_secret: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  phone: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parent_user: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '0',
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: false, 
});

module.exports = User;
