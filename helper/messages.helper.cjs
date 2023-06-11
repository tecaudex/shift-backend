const Message = require("../models/message.model.cjs");

// To save message in DB
exports.saveThisMessage = async (chatId, role, content) => {
  await Message.create({ chatId, role, content });
};

// To get all messages from DB
exports.getAllMessages = async (chatId) => {
  try {
    const messages = await Message.find({ chatId }, { chatId: 0 });
    return messages.length > 0 ? messages : [];
  } catch (err) {
    console.log("Error while getting all messages from DB", err);
  }
};
