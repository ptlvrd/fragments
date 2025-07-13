// src/routes/api/get-id.js

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const markdownIt = require('markdown-it');
const md = new markdownIt();
const path = require('path');

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

    const data = await fragment.getData();

    // Handle Markdown to HTML conversion
    if (ext === '.html' && fragment.type === 'text/markdown') {
      const html = md.render(data.toString());
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    // If no extension or unsupported conversion, return raw
    res.setHeader('Content-Type', fragment.type);
    return res.status(200).send(data);
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment');
    res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragment'));
  }
};
