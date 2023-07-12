const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller.cjs");
const authenticate = require("../middleware/authMiddleware.cjs");

router.use(authenticate);

// GET /chats/:chatId
router.get("/:chatId", chatController.getChat);

// POST /chats
router.post("/", chatController.createChat);

// PUT /chats/:chatId
router.put("/:chatId", chatController.updateChat);

// DELETE /chats/:chatId
router.delete("/:chatId", chatController.deleteChat);

module.exports = router;
