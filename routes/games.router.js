const express = require("express");
const {
  createGame,
  getGames,
  getGameById,
  updateGame,
  deleteGame,
} = require("../controllers/games.controller");

const { authenticateFirebaseUser } = require("../middleware/firebase");
// router.use(authenticateFirebaseUser);

const router = express.Router();

// Create a new game
router.post("/create", createGame);

// Get all games
router.get("/", getGames);

// Get game by ID
router.get("/:id", getGameById);

// Update game
router.put("/update/:id", updateGame);

// Delete game
router.delete("/delete/:id", deleteGame);

module.exports = router;
