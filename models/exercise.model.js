const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");

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
      type: DataTypes.STRING,
      allowNull: false,
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);
Exercise.sync();
module.exports = Exercise;
