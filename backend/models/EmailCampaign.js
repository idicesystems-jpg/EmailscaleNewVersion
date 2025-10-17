const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const EmailCampaign = sequelize.define('EmailCampaign', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    imap_username: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    imap_password: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    imap_host: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    imap_port: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    campaign_id: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    email_status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'email_campaigns',
    timestamps: false
  });

module.exports = EmailCampaign;