const express = require("express");
const router = express.Router();
const {
  getGratitudesForWeek,
  getAllGratitudes,
  create,
} = require("../controllers/gratitude.controller");
const { authenticateFirebaseUser } = require("../middleware/firebase");

router.use(authenticateFirebaseUser);

router.get("/week", getGratitudesForWeek);

router.get("/", getAllGratitudes);

router.post("/create", create);

module.exports = router;
