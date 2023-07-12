const Message = require("../models/message.model.cjs");

async function getMessage(req, res) {
  try {
    const { messageId } = req.params;

    const message = await Message.findByPk(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    return res.status(200).json(message);
  } catch (error) {
    console.error("Error retrieving message:", error);
    return res.status(500).json({ error: "Failed to retrieve message" });
  }
}

async function createMessage(req, res) {
  try {
    const { chatId, role, content } = req.body;

    const message = await Message.create({
      chatId,
      role,
      content,
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return res.status(500).json({ error: "Failed to create message" });
  }
}

async function updateMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { chatId, role, content } = req.body;

    const [rowsUpdated] = await Message.update(
      {
        chatId,
        role,
        content,
      },
      {
        where: {
          id: messageId,
        },
      }
    );

    if (rowsUpdated === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    return res.status(200).json({ message: "Message updated successfully" });
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({ error: "Failed to update message" });
  }
}

async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;

    const rowsDeleted = await Message.destroy({
      where: {
        id: messageId,
      },
    });

    if (rowsDeleted === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ error: "Failed to delete message" });
  }
}

module.exports = {
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
};
