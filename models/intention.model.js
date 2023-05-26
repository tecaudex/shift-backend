const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");
const User = require("./users.model");

const Intention = sequelize.define("Intention", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  event: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  intention: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Intention.belongsTo(User, { foreignKey: "userId" });
Intention.sync();

module.exports = Intention;
