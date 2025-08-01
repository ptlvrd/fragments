// src/routes/api/get-id.js

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const path = require('path');

// Map file extensions to MIME types
const extensionToMimeType = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

module.exports = async (req, res) => {
  try {
    let { id } = req.params;
    const ext = path.extname(id); // e.g., '.html'
    const baseId = id.replace(ext, '');

    const fragment = await Fragment.byId(req.user, baseId);
    if (!fragment) {
      logger.warn({ id: baseId }, 'Fragment not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // If extension is provided, attempt conversion
    if (ext) {
      const targetType = extensionToMimeType[ext];
      if (!targetType) {
        logger.warn({ ext }, 'Unsupported file extension');
        return res.status(415).json(createErrorResponse(415, 'Unsupported file extension'));
      }

      try {
        const convertedData = await fragment.convertTo(targetType);
        res.setHeader('Content-Type', targetType);
        return res.status(200).send(convertedData);
      } catch (conversionError) {
        logger.warn(
          { fragmentType: fragment.type, targetType, error: conversionError.message },
          'Fragment conversion failed'
        );
        return res.status(415).json(createErrorResponse(415, 'Fragment conversion not supported'));
      }
    }

    // If no extension, return raw data
    const data = await fragment.getData();
    res.setHeader('Content-Type', fragment.type);
    return res.status(200).send(data);
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment');
    res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragment'));
  }
};
