const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);

    if (!fragment) {
      logger.warn({ id: req.params.id }, 'Fragment not found for deletion');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    await Fragment.delete(req.user, req.params.id);
    logger.info({ id: req.params.id }, 'Fragment deleted');
    return res.status(200).json(createSuccessResponse({ status: 'ok' }));
  } catch (err) {
    logger.error({ err }, 'Error deleting fragment');
    return res.status(500).json(createErrorResponse(500, 'Failed to delete fragment'));
  }
};
