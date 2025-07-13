const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const expand = req.query.expand === '1'; // ← check if expand is set
    const fragments = await Fragment.byUser(req.user, expand); // ← pass flag to model
    logger.info({ expand, count: fragments.length }, 'Fragments fetched');
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve fragments');
    res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragments'));
  }
};
