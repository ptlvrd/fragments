const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

// Support sending various Content-Types on the body up to 5M in size
const rawBody = () =>
  require('express').raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type. If we can, `req.body` will be
      // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
      // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });

module.exports = [
  rawBody(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user } = req;

      if (!user) {
        logger.warn('Unauthorized attempt to update fragment');
        return res.status(401).json({
          status: 'error',
          error: {
            code: 401,
            message: 'Unauthorized',
          },
        });
      }

      // Check if fragment exists
      const existingFragment = await Fragment.byId(user, id);
      
      if (!existingFragment) {
        logger.warn({ userId: user, fragmentId: id }, 'Fragment not found for update');
        return res.status(404).json({
          status: 'error',
          error: {
            code: 404,
            message: 'Fragment not found',
          },
        });
      }

      // Check if request has a body
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        logger.warn({ userId: user, fragmentId: id }, 'No valid body provided for update');
        return res.status(400).json({
          status: 'error',
          error: {
            code: 400,
            message: 'No valid body provided',
          },
        });
      }

      // Check if Content-Type matches existing fragment type
      const requestType = req.get('Content-Type');
      if (requestType !== existingFragment.type) {
        logger.warn(
          { userId: user, fragmentId: id, requestType, existingType: existingFragment.type },
          'Content-Type mismatch for fragment update'
        );
        return res.status(400).json({
          status: 'error',
          error: {
            code: 400,
            message: `Content-Type mismatch. Fragment is ${existingFragment.type}, but request is ${requestType}`,
          },
        });
      }

      // Update the fragment data
      await existingFragment.setData(req.body);

      logger.info(
        { userId: user, fragmentId: id, size: req.body.length },
        'Fragment updated successfully'
      );

      res.status(200).json({
        status: 'ok',
        fragment: {
          id: existingFragment.id,
          ownerId: existingFragment.ownerId,
          created: existingFragment.created,
          updated: existingFragment.updated,
          type: existingFragment.type,
          size: existingFragment.size,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error updating fragment');
      res.status(500).json({
        status: 'error',
        error: {
          code: 500,
          message: 'Internal server error',
        },
      });
    }
  },
]; 