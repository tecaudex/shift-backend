const express = require("express");
const router = express.Router();
const {
  createSession,
  getAllSessions,
  getSession,
  addFormToSession,
  addFeelingToSession,
  getFeelingPercentage,
  getGratitudesBySessionId,
} = require("../controllers/session.controller.cjs");
const authenticate = require("../middleware/authMiddleware.cjs");

router.use(authenticate);

// Get feeling percentage
router.get("/feeling", getFeelingPercentage);

// Post feeling to session
router.post("/feeling/:sessionId", addFeelingToSession);

// Get session information
router.get("/:sessionId", getSession);

// Get gratitude from session
router.get("/:sessionId/gratitude", getGratitudesBySessionId);

// Post gratitude to session
router.post("/:sessionId", addFormToSession);

// Create a new session
router.post("/", createSession);

// Get all sessions
router.get("/", getAllSessions);

module.exports = router;
