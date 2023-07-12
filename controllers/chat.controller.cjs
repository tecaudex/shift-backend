const Chat = require("../models/chat.model.cjs");

async function getChat(req, res) {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findByPk(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.status(200).json(chat);
  } catch (error) {
    console.error("Error retrieving chat:", error);
    return res.status(500).json({ error: "Failed to retrieve chat" });
  }
}

async function createChat(req, res) {
  try {
    const { exerciseId, userId } = req.body;

    const chat = await Chat.create({
      exerciseId,
      userId,
    });

    return res.status(201).json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return res.status(500).json({ error: "Failed to create chat" });
  }
}

async function updateChat(req, res) {
  try {
    const { chatId } = req.params;
    const { exerciseId, userId } = req.body;

    const [rowsUpdated] = await Chat.update(
      {
        exerciseId,
        userId,
      },
      {
        where: {
          id: chatId,
        },
      }
    );

    if (rowsUpdated === 0) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.status(200).json({ message: "Chat updated successfully" });
  } catch (error) {
    console.error("Error updating chat:", error);
    return res.status(500).json({ error: "Failed to update chat" });
  }
}

async function deleteChat(req, res) {
  try {
    const { chatId } = req.params;

    const rowsDeleted = await Chat.destroy({
      where: {
        id: chatId,
      },
    });

    if (rowsDeleted === 0) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return res.status(500).json({ error: "Failed to delete chat" });
  }
}

module.exports = {
  getChat,
  createChat,
  updateChat,
  deleteChat,
};
