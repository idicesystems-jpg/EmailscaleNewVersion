const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

  const EmailCampaignStatus = sequelize.define(
    "EmailCampaignStatus",
    {
      ecsid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      campaign_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      is_spam: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_send: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_send1: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      senders: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      reply_sender: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      spam_data: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_run: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_complete: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "email_campaign_statuses",
      timestamps: false, // already using created_at & updated_at manually
    }
  );

  //  Relationship (matches Laravel: belongsTo Campaign)
  EmailCampaignStatus.associate = (models) => {
    EmailCampaignStatus.belongsTo(models.Campaign, {
      foreignKey: "campaign_id",
      targetKey: "id", // Campaign's id field
      as: "campaign",
    });
  };


  module.exports = EmailCampaignStatus;
