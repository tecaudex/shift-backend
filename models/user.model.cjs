const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection.cjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "regular"),
      defaultValue: "regular",
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountCreationMethod: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    timestamps: true,
  }
);

User.sync({ alter: true });

module.exports = User;
