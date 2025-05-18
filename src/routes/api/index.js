// src/routes/api/index.js

const express = require('express');
const router = express.Router();

// Define the GET /v1/fragments route
router.get('/fragments', require('./get'));

module.exports = router;
