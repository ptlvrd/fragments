// src/routes/api/get-id-info.js

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Use Fragment.byId instead of readFragment directly
    const fragment = await Fragment.byId(req.user, id);

    if (!fragment) {
      logger.warn({ id }, 'Fragment not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Return the fragment info
    res.status(200).json({
      status: 'ok',
      fragment: {
        id: fragment.id,
        type: fragment.type,
        size: fragment.size,
        created: fragment.created,
        updated: fragment.updated,
        ownerId: fragment.ownerId,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment info');
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};