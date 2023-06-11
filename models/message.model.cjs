const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection.cjs");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Message",
    timestamps: true,
  }
);

Message.sync({ alter: true });

module.exports = Message;
