const express = require("express");
const router = express.Router();
const exerciseController = require("../controllers/exercise.controller.cjs");
const authenticate = require("../middleware/authMiddleware.cjs");

router.use(authenticate);

// Create a new game
router.post("/create", exerciseController.createExercise);

// Get all games
router.get("/", exerciseController.getExercises);

// Get game by ID
router.get("/:id", exerciseController.getExerciseById);

// Update game
router.put("/update/:id", exerciseController.updateExercise);

// Delete game
router.delete("/delete/:id", exerciseController.deleteExercise);

module.exports = router;
