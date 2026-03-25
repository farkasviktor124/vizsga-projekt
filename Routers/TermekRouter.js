const express = require('express');
const router = express.Router();
const { getTermek, ujTermek } = require("../Controllers/TermekController");

router.get("/all", getTermek);
router.post("/uj", ujTermek);

module.exports = router;
