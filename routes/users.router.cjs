const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller.cjs");
const multer = require("multer");
const upload = multer({
  limits: { fileSize: 50 * 1000 * 1000 },
  dest: "uploads/",
});
const streakRoutes = require("./streaks.router.cjs");
const authenticate = require("../middleware/authMiddleware.cjs");

// User signup route
router.post("/signup", userController.signup);

// User login route
router.post("/login", userController.login);

// Check if user exists route
router.post("/exists", userController.checkUserExists);

// get user profile
router.use("/streaks", streakRoutes);

// GET user by ID
router.get("/", authenticate, userController.getUser);

// update user profile
router.patch("/", upload.single("profilePicture"), userController.updateUser);

// get user statistics
router.get("/stats", userController.getGratitudeStats);

// get user statistics
router.get("/results", userController.getResults);

// delete user account
router.delete("/", userController.deleteUser);

module.exports = router;
