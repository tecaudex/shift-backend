const express = require("express");
const router = express.Router();
const { getStreak } = require("../controllers/streak.controller.cjs");
const authenticate = require("../middleware/authMiddleware.cjs");

router.get("/:actionType", authenticate, getStreak);

module.exports = router;
