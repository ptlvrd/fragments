const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  try {
    const fragments = await Fragment.byUser(req.user);
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch {
    res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragments'));
  }

};