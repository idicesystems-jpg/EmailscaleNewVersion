const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // adjust path to your Sequelize instance

const Campaign = sequelize.define(
  "Campaign",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    campaign_name: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    campaign_message: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    first_name: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    smtp_username: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    smtp_password: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    email_provider: {
      type: DataTypes.STRING(256),
      allowNull: true,
      defaultValue: "SMTP",
    },
    smtp_host: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    smtp_port: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    daily_limit: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    warmup_enabled: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    warmup_limit: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    previous_user_id: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    message_type: {
      type: DataTypes.STRING(256),
      allowNull: true,
      defaultValue: "1",
    },
    warmup_emails: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    total_email: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    refresh_token: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date("0000-00-00 00:00:00"),
    },
  },
  {
    tableName: "campaigns",
    timestamps: false,
  }
);

Campaign.associate = (models) => {
  Campaign.hasMany(models.EmailCampaignStatus, {
    foreignKey: "campaign_id",
    sourceKey: "id",
    as: "emailStatuses",
  });
};

module.exports = Campaign;
