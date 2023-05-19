const express = require("express");
const router = express.Router();
const { getStreak } = require("../controllers/streak.controller");
const { authenticateFirebaseUser } = require("../middleware/firebase");

router.use(authenticateFirebaseUser);

router.get("/:actionType", getStreak);

module.exports = router;
