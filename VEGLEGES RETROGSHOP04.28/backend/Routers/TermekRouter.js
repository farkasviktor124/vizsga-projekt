const express = require('express');
const router = express.Router();
const { getTermekek, createTermek } = require('../Controllers/termekekController');

// GET /termekek
router.get('/', getTermekek);

// POST /termekek
router.post('/', createTermek);

module.exports = router;