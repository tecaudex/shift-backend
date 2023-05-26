const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    f_id: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      trim: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        isEmail: true, // email validation
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 128], // at least 6 characters, at most 128 characters
      },
    },
    profilePicture: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "regular",
      validate: {
        isIn: [["regular", "admin"]], // only allow 'regular' or 'admin' as values
      },
    },
    provider: {
      type: DataTypes.STRING,
      defaultValue: "email",
      validate: {
        isIn: [["email", "google", "apple"]],
      },
    },
  },
  {
    sequelize,
    modelName: "User",
    timestamps: true,
  }
);
User.sync();

module.exports = User;
