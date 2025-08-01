// File: src/model/fragment.js

const { randomUUID } = require('crypto');
const contentType = require('content-type');
const sharp = require('sharp');

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
    return this.mimeType.startsWith('text/') || 
           this.mimeType === 'application/json' || 
           this.mimeType === 'application/yaml';
  }

  get isImage() {
    return this.mimeType.startsWith('image/');
  }

  get formats() {
    const formats = [this.mimeType];
    
    // Add conversion formats based on type
    if (this.isText) {
      if (this.mimeType === 'text/markdown') {
        formats.push('text/html', 'text/plain');
      } else if (this.mimeType === 'text/html') {
        formats.push('text/plain');
      } else if (this.mimeType === 'text/csv') {
        formats.push('text/plain', 'application/json');
      } else if (this.mimeType === 'application/json') {
        formats.push('application/yaml', 'text/plain');
      } else if (this.mimeType === 'application/yaml') {
        formats.push('text/plain');
      }
    } else if (this.isImage) {
      formats.push('image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif');
    }
    
    return formats;
  }

  async convertTo(targetType) {
    if (!this.formats.includes(targetType)) {
      throw new Error(`Cannot convert ${this.mimeType} to ${targetType}`);
    }

    const data = await this.getData();
    
    if (this.isText) {
      return this.convertText(data, targetType);
    } else if (this.isImage) {
      return this.convertImage(data, targetType);
    }
    
    throw new Error(`Unsupported conversion from ${this.mimeType} to ${targetType}`);
  }

  async convertText(data, targetType) {
    const text = data.toString('utf8');
    
    switch (targetType) {
      case 'text/html':
        if (this.mimeType === 'text/markdown') {
          const MarkdownIt = require('markdown-it');
          const md = new MarkdownIt();
          return Buffer.from(md.render(text));
        }
        break;
      case 'text/plain':
        if (this.mimeType === 'text/html') {
          // Simple HTML to text conversion (remove tags)
          return Buffer.from(text.replace(/<[^>]*>/g, ''));
        } else if (this.mimeType === 'text/markdown') {
          // Simple markdown to text conversion (remove markdown syntax)
          return Buffer.from(text.replace(/[#*`]/g, ''));
        }
        break;
      case 'application/json':
        if (this.mimeType === 'text/csv') {
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',');
          const json = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
              obj[header.trim()] = values[index]?.trim() || '';
              return obj;
            }, {});
          });
          return Buffer.from(JSON.stringify(json, null, 2));
        }
        break;
      case 'application/yaml':
        if (this.mimeType === 'application/json') {
          const yaml = require('js-yaml');
          const obj = JSON.parse(text);
          return Buffer.from(yaml.dump(obj));
        }
        break;
    }
    
    throw new Error(`Unsupported text conversion from ${this.mimeType} to ${targetType}`);
  }

  async convertImage(data, targetType) {
    let sharpInstance = sharp(data);
    
    switch (targetType) {
      case 'image/png':
        return await sharpInstance.png().toBuffer();
      case 'image/jpeg':
        return await sharpInstance.jpeg().toBuffer();
      case 'image/webp':
        return await sharpInstance.webp().toBuffer();
      case 'image/gif':
        return await sharpInstance.gif().toBuffer();
      case 'image/avif':
        return await sharpInstance.avif().toBuffer();
      default:
        throw new Error(`Unsupported image conversion to ${targetType}`);
    }
  }

  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      return type.startsWith('text/') || 
             type === 'application/json' || 
             type === 'application/yaml' ||
             type.startsWith('image/');
    } catch {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
