const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  txn_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  domain: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  txn_amount: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  txn_status: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'transactions',
  timestamps: false,
});

// ✅ Define relationship
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });

module.exports = Transaction;
