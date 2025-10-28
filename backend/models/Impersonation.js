const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path to your sequelize instance

const Impersonation = sequelize.define('Impersonation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  impersonated_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  impersonated_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'impersonations',
  timestamps: false, // we’re using custom columns, not created_at/updated_at
});

module.exports = Impersonation;
