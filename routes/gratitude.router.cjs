const express = require("express");
const router = express.Router();
const {
  getGratitudesForWeek,
  getAllGratitudes,
  create,
} = require("../controllers/gratitude.controller.cjs");
const authenticate = require("../middleware/authMiddleware.cjs");

router.get("/week", authenticate, getGratitudesForWeek);

router.get("/", authenticate, getAllGratitudes);

router.post("/", authenticate, create);

module.exports = router;
