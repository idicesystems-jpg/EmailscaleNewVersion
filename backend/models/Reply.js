// models/Reply.js
const { DataTypes } = require("sequelize");
const sequelize = require('../config/database');
const User = require('./User');
const Reply = sequelize.define(
  "Reply",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "replies",
    timestamps: false,
  }
);
Reply.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
module.exports = Reply;
