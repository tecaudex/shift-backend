const Games = require("../models/games.model");

// 🎮 Create new game
exports.createGame = async (req, res) => {
  console.log("req.body", req.body);
  try {
    let { name, systemMessage } = req.body;
    if (!name || !systemMessage) {
      return res
        .status(404)
        .json({ error: "Name & Content both are required" });
    }
    // 🎮 New game instance
    const game = new Games(req.body);
    // 💾 Save game to database
    const savedGame = await game.save();
    console.log("savedGame", savedGame);
    // ✅ Return saved game (201 - Created)
    res.status(201).json(savedGame);
  } catch (error) {
    console.log("error", error);
    // ❌ Handle game creation error (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to create game" });
  }
};

// 🕹️ Get all games
exports.getGames = async (req, res) => {
  try {
    // 🎮 Retrieve all games
    const games = await Games.find();
    // ✅ Return games (200 - OK)
    res.status(200).json(games);
  } catch (error) {
    // ❌ Handle error retrieving games (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to retrieve games" });
  }
};

// 🔍 Get game by ID
exports.getGameById = async (req, res) => {
  try {
    // 🎮 Find game by ID
    const game = await Games.findById(req.params.id);
    if (!game) {
      // ❌ Handle game not found (404 - Not Found)
      return res.status(404).json({ error: "Game not found" });
    }
    // ✅ Return game (200 - OK)
    res.status(200).json(game);
  } catch (error) {
    // ❌ Handle error retrieving game (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to retrieve game" });
  }
};

// ✏️ Update game
exports.updateGame = async (req, res) => {
  try {
    // 🎮 Find and update game by ID
    const game = await Games.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!game) {
      // ❌ Handle game not found (404 - Not Found)
      return res.status(404).json({ error: "Game not found" });
    }
    // ✅ Return updated game (200 - OK)
    res.status(200).json(game);
  } catch (error) {
    // ❌ Handle error updating game (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to update game" });
  }
};

// ❌ Delete game
exports.deleteGame = async (req, res) => {
  try {
    // 🎮 Find and remove game by ID
    const game = await Games.findByIdAndRemove(req.params.id);
    if (!game) {
      // ❌ Handle game not found (404 - Not Found)
      return res.status(404).json({ error: "Game not found" });
    }
    // ✅ Return success message (200 - OK)
    res.status(200).json({ message: "Game deleted successfully" });
  } catch (error) {
    // ❌ Handle error deleting game (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to delete game" });
  }
};
