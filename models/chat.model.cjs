const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection.cjs");
const Message = require("./message.model.cjs");
const Exercise = require("./exercise.model.cjs");
const User = require("./user.model.cjs");

const Chat = sequelize.define(
  "Chat",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    exerciseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Chat",
    timestamps: true,
  }
);

Chat.sync({ alter: true });

module.exports = Chat;
