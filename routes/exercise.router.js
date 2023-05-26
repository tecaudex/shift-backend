const express = require("express");
const {
  createExercise,
  deleteExercise,
  getExerciseById,
  getExercises,
  updateExercise,
} = require("../controllers/exercise.controller");

const { authenticateFirebaseUser } = require("../middleware/firebase");
// router.use(authenticateFirebaseUser);

const router = express.Router();

// Create a new game
router.post("/create", createExercise);

// Get all games
router.get("/", getExercises);

// Get game by ID
router.get("/:id", getExerciseById);

// Update game
router.put("/update/:id", updateExercise);

// Delete game
router.delete("/delete/:id", deleteExercise);

module.exports = router;
