const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection.cjs");
const Chat = require("./chat.model.cjs");

const Exercise = sequelize.define(
  "Exercise",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    systemMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Exercise",
    timestamps: true,
  }
);

Exercise.sync({ alter: true });

module.exports = Exercise;
