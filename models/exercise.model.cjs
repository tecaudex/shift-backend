const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection.cjs");

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
    model: {
      type: DataTypes.ENUM("gpt-3.5-turbo", "gpt-3.5-turbo-0301"),
      defaultValue: "gpt-3.5-turbo",
    },
    temperature: {
      type: DataTypes.DOUBLE,
      defaultValue: 1,
      validate: {
        min: 0,
        max: 2,
      },
    },
    maxLength: {
      type: DataTypes.INTEGER,
      defaultValue: 256,
      validate: {
        min: 1,
        max: 2048,
      },
    },
    topP: {
      type: DataTypes.DOUBLE,
      defaultValue: 1,
      validate: {
        min: 0,
        max: 1,
      },
    },
    frequencyPenalty: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 2,
      },
    },
    presencePenalty: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 2,
      },
    },
    feelingImage: {
      type: DataTypes.STRING,
    },
    journeyImage: {
      type: DataTypes.STRING,
    },
    displayName: {
      type: DataTypes.STRING,
    },
    shortDescription: {
      type: DataTypes.TEXT,
    },
    longDescription: {
      type: DataTypes.TEXT,
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      unique: true,
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
