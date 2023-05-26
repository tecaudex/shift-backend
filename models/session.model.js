const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");
const User = require("./users.model");
const Gratitude = require("./gratitude.model");

const Session = sequelize.define("Session", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  user: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
  },
  gratitudes: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Gratitude",
      key: "id",
    },
  },
  timeTaken: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  feeling: {
    type: DataTypes.STRING,
  },
  isSessionOpen: {
    type: DataTypes.BOOLEAN,
  },
});

Session.belongsTo(User, { foreignKey: "user" });
Session.hasMany(Gratitude, { foreignKey: "sessionId" });
Session.sync();

module.exports = Session;
