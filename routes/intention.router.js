const express = require("express");
const router = express.Router();
const { setIntention } = require("../controllers/intention.controller");
const { authenticateFirebaseUser } = require("../middleware/firebase");

router.use(authenticateFirebaseUser);

router.post("/", setIntention);

module.exports = router;
