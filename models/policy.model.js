const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");

const Policy = sequelize.define("Policy", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});
Policy.sync();

module.exports = Policy;
