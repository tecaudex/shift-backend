const Chat = require("./chat.model.cjs");
const Message = require("./message.model.cjs");
const User = require("./user.model.cjs");
const Exercise = require("./exercise.model.cjs");

Chat.hasMany(Message, { foreignKey: "chatId" });
Message.belongsTo(Chat, { foreignKey: "chatId" });
Exercise.hasMany(Chat, { foreignKey: "exerciseId" });
Chat.belongsTo(Exercise, { foreignKey: "exerciseId" });
Chat.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Chat, { foreignKey: "userId" });
