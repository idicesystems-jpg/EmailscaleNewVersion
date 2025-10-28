const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path to your sequelize instance
const User = require('./User'); // import User model for association

const UserPreference = sequelize.define('UserPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  onboarding_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'user_preferences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Association
// UserPreference.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
// User.hasOne(UserPreference, { foreignKey: 'user_id', onDelete: 'CASCADE' });

module.exports = UserPreference;
