const Message = require("../models/message.model");

// To save message in DB
exports.saveThisMessage = async (sessionId, role, content) => {
  await Message.create({ sessionId, role, content });
};

// To get all messages from DB
exports.getAllMessages = async (sessionId) => {
  try {
    const messages = await Message.find({ sessionId }, { sessionId: 0 });
    return messages.length > 0 ? messages : [];
  } catch (err) {
    console.log("Error while getting all messages from DB", err);
  }
};
