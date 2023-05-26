const { DataTypes } = require("sequelize");
const sequelize = require("../db/connection");
const Session = require("./session.model");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Sessions",
        key: "id",
      },
    },
    role: {
      type: DataTypes.STRING,
    },
    content: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
  }
);

Message.belongsTo(Session, { foreignKey: "sessionId" });
Message.sync();

module.exports = Message;
