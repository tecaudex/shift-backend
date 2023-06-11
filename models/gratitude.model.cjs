const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection.cjs");
const User = require("./user.model.cjs");

const Gratitude = sequelize.define("Gratitude", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timeTaken: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

Gratitude.belongsTo(User, { foreignKey: "userId" });

module.exports = Gratitude;
