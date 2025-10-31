const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // adjust path to your Sequelize instance

const AiReplyMessage = sequelize.define(
  "AiReplyMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    message: {
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
    tableName: "ai_reply_messages",
    timestamps: false, // Laravel handles timestamps manually
  }
);

AiReplyMessage.associate = (models) => {
  // Example: if AiReplyMessage belongs to User
  AiReplyMessage.belongsTo(models.User, {
    foreignKey: "user_id",
    targetKey: "id",
    as: "user",
  });
};

module.exports = AiReplyMessage;
