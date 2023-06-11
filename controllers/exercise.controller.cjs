const Exercise = require("../models/exercise.model.cjs");

// 🎮 Create new exercise
exports.createExercise = async (req, res) => {
  console.log("req.body", req.body);
  try {
    let { name, systemMessage } = req.body;
    if (!name || !systemMessage) {
      return res
        .status(404)
        .json({ error: "Name & Content both are required" });
    }
    // 🎮 Create a new exercise
    const exercise = await Exercise.create(req.body);
    console.log("exercise", exercise);
    // ✅ Return saved exercise (201 - Created)
    res.status(201).json(exercise);
  } catch (error) {
    console.log("error", error);
    // ❌ Handle exercise creation error (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to create exercise" });
  }
};

// 🕹️ Get all exercises
exports.getExercises = async (req, res) => {
  try {
    // 🎮 Retrieve all exercises
    const exercises = await Exercise.findAll();
    // ✅ Return exercises (200 - OK)
    res.status(200).json(exercises);
  } catch (error) {
    // ❌ Handle error retrieving exercises (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to retrieve exercises" });
  }
};

// 🔍 Get exercise by ID
exports.getExerciseById = async (req, res) => {
  try {
    // 🎮 Find exercise by ID
    const exercise = await Exercise.findByPk(req.params.id);
    if (!exercise) {
      // ❌ Handle exercise not found (404 - Not Found)
      return res.status(404).json({ error: "Exercise not found" });
    }
    // ✅ Return exercise (200 - OK)
    res.status(200).json(exercise);
  } catch (error) {
    // ❌ Handle error retrieving exercise (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to retrieve exercise" });
  }
};

// ✏️ Update exercise
exports.updateExercise = async (req, res) => {
  try {
    // 🎮 Find and update exercise by ID
    const [updatedRowsCount, [updatedExercise]] = await Exercise.update(
      req.body,
      {
        where: { id: req.params.id },
        returning: true,
      }
    );
    if (updatedRowsCount === 0) {
      // ❌ Handle exercise not found (404 - Not Found)
      return res.status(404).json({ error: "Exercise not found" });
    }
    // ✅ Return updated exercise (200 - OK)
    res.status(200).json(updatedExercise);
  } catch (error) {
    // ❌ Handle error updating exercise (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to update exercise" });
  }
};

// ❌ Delete exercise
exports.deleteExercise = async (req, res) => {
  try {
    // 🎮 Find and remove exercise by ID
    const deletedRowCount = await Exercise.destroy({
      where: { id: req.params.id },
    });
    if (deletedRowCount === 0) {
      // ❌ Handle exercise not found (404 - Not Found)
      return res.status(404).json({ error: "Exercise not found" });
    }
    // ✅ Return success message (200 - OK)
    res.status(200).json({ message: "Exercise deleted successfully" });
  } catch (error) {
    // ❌ Handle error deleting exercise (500 - Internal Server Error)
    res.status(500).json({ error: "Failed to delete exercise" });
  }
};
