const express = require('express');
const router = express.Router();
const { version, author } = require('../../package.json');
const { createSuccessResponse } = require('../response');
const { authenticate } = require('../auth');

router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      author,
      githubUrl: 'https://github.com/ptlvrd/fragments',
      version,
    })
  );
});

router.use('/v1', authenticate(), require('./api'));

module.exports = router;
