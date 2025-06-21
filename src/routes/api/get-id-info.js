// src/routes/api/get-id-info.js

const { readFragment } = require('../../model/data/memory');
const Fragment = require('../../model/fragment');

module.exports = async (req, res) => {
  try {
    const fragmentData = await readFragment(req.user, req.params.id);

    if (!fragmentData) {
      return res.status(404).json({
        status: 'error',
        message: 'Fragment not found',
      });
    }

    // Convert plain object to Fragment instance
    const fragment = new Fragment(fragmentData);

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
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
