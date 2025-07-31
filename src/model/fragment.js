// File: src/model/fragment.js

const { randomUUID } = require('crypto');
const contentType = require('content-type');

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId || !type) throw new Error('ownerId and type are required');
    if (typeof size !== 'number' || size < 0) throw new Error('size must be non-negative number');
    if (!Fragment.isSupportedType(type)) throw new Error(`Unsupported type: ${type}`);

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
  }

  static async byUser(ownerId, expand = false) {
    const fragments = await listFragments(ownerId, expand);
    return expand ? fragments.map((f) => new Fragment(f)) : fragments;
  }

  static async byId(ownerId, id) {
    const data = await readFragment(ownerId, id);
    if (!data) return null;
    return new Fragment(data);
  }

  static async delete(ownerId, id) {
  try {
    // First verify the fragment exists
    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      throw new Error('Fragment not found');
    }
    
    // Delete both metadata and data
    await deleteFragment(ownerId, id);
    return true;
  } catch (err) {
    throw new Error(`Unable to delete fragment: ${err.message}`);
  }
}

  async save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) throw new Error('Data must be a Buffer');
    this.size = data.length;
    this.updated = new Date().toISOString();
    const logger = require('../logger');
    logger.debug({ ownerId: this.ownerId, id: this.id, size: data.length }, 'setData called');
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  get mimeType() {
    return contentType.parse(this.type).type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  get formats() {
    return [this.mimeType];
  }

  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      return type.startsWith('text/') || type === 'application/json';
    } catch {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
