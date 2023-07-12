const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller.cjs");

// GET /messages/:messageId
router.get("/:messageId", messageController.getMessage);

// POST /messages
router.post("/", messageController.createMessage);

// PUT /messages/:messageId
router.put("/:messageId", messageController.updateMessage);

// DELETE /messages/:messageId
router.delete("/:messageId", messageController.deleteMessage);

module.exports = router;
