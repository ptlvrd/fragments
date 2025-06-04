const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const id = req.params.id;
    const fragment = await Fragment.byId(req.user, id);

    if (!fragment) {
      logger.warn({ id }, 'Fragment not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    const data = await fragment.getData();

    // Set the correct content type
    res.setHeader('Content-Type', fragment.type);

    // Return the raw data
    return res.status(200).send(data);
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment');
    return res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragment'));
  }
};
