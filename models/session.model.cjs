const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection.cjs");
const User = require("./user.model.cjs");
const Gratitude = require("./gratitude.model.cjs");

const Session = sequelize.define("Session", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "User",
      key: "id",
    },
  },
});

Session.belongsTo(User, { foreignKey: "userId" });

module.exports = Session;
