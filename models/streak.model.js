const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");

const Streak = sequelize.define(
  "Streak",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    actionType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastActionTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    streakCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    dailyChange: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Streak",
  }
);
Streak.sync();

module.exports = Streak;
