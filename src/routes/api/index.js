// src/routes/api/index.js

const express = require('express');
const router = express.Router();
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

// Define the GET /v1/fragments route
router.get('/fragments', require('./get'));

// Middleware to parse raw body for supported Content-Types (up to 5MB)
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });

router.post('/fragments', rawBody(), require('./post'));

module.exports = router;
