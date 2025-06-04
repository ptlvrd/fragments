const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const contentType = require('content-type');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug({ headers: req.headers }, 'Handling POST /v1/fragments');

  // Validate that we received a parsed Buffer from rawBody middleware
  if (!Buffer.isBuffer(req.body)) {
    logger.warn('Request body is not a valid Buffer');
    return res.status(415).json(createErrorResponse(415, 'Unsupported Content-Type'));
  }

  const { type } = req.headers['content-type'] ? contentType.parse(req) : { type: null };

  if (!Fragment.isSupportedType(type)) {
    logger.warn({ type }, 'Unsupported content type');
    return res.status(415).json(createErrorResponse(415, 'Unsupported Content-Type'));
  }

  try {
    const fragment = new Fragment({
      ownerId: req.user,
      type,
      size: req.body.length,
    });

    await fragment.save();
    await fragment.setData(req.body);

    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = new URL(`/v1/fragments/${fragment.id}`, baseUrl).toString();

    logger.info({ fragmentId: fragment.id }, 'Fragment created');
    res.setHeader('Location', location);
    return res.status(201).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    return res.status(500).json(createErrorResponse(500, 'Failed to create fragment'));
  }
};
