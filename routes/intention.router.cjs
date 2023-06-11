const express = require("express");
const router = express.Router();
const { setIntention } = require("../controllers/intention.controller.cjs");
const authenticate = require("../middleware/authMiddleware.cjs");

router.post("/", authenticate, setIntention);

module.exports = router;
