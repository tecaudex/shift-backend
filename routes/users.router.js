const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller");
const { authenticateFirebaseUser } = require("../middleware/firebase");
const multer = require("multer");
const upload = multer({
  limits: { fileSize: 50 * 1000 * 1000 },
  dest: "uploads/",
});
const streakRoutes = require("./streaks.router");

router.use(authenticateFirebaseUser);

// get user profile
router.use("/streaks", streakRoutes);

// get user profile
router.get("/", userController.getUser);

// update user profile
router.patch("/", upload.single("profilePicture"), userController.updateUser);

// get user statistics
router.get("/stats", userController.getGratitudeStats);

// get user statistics
router.get("/results", userController.getResults);

// delete user account
router.delete("/", userController.deleteUser);

module.exports = router;
