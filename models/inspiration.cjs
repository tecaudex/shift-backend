const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection.cjs");

const Inspiration = sequelize.define("Inspiration", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  heading: {
    type: DataTypes.STRING,
  },
  subheading: {
    type: DataTypes.STRING,
  },
});

Inspiration.sync({ alter: true });

module.exports = Inspiration;
