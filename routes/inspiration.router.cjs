const express = require("express");
const router = express.Router();
const {
  GetInpiration,
  SetInpiration,
} = require("../controllers/inspiration.controller.cjs");

router.get("/", GetInpiration);

router.post("/", SetInpiration);

module.exports = router;
