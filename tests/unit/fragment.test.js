const { Fragment } = require('../../src/model/fragment');
const { readFragment, writeFragment, readFragmentData, writeFragmentData, listFragments, deleteFragment } = require('../../src/model/data');

// Mock the data module
jest.mock('../../src/model/data');

describe('Fragment', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Fragment.isSupportedType()', () => {
    test('returns true for supported text types', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
      expect(Fragment.isSupportedType('text/markdown')).toBe(true);
      expect(Fragment.isSupportedType('text/html')).toBe(true);
      expect(Fragment.isSupportedType('text/csv')).toBe(true);
    });

    test('returns true for supported application types', () => {
      expect(Fragment.isSupportedType('application/json')).toBe(true);
      expect(Fragment.isSupportedType('application/yaml')).toBe(true);
    });

    test('returns true for supported image types', () => {
      expect(Fragment.isSupportedType('image/png')).toBe(true);
      expect(Fragment.isSupportedType('image/jpeg')).toBe(true);
      expect(Fragment.isSupportedType('image/webp')).toBe(true);
      expect(Fragment.isSupportedType('image/gif')).toBe(true);
      expect(Fragment.isSupportedType('image/avif')).toBe(true);
    });

    test('returns false for unsupported types', () => {
      expect(Fragment.isSupportedType('application/xml')).toBe(false);
      expect(Fragment.isSupportedType('video/mp4')).toBe(false);
      expect(Fragment.isSupportedType('audio/mpeg')).toBe(false);
    });

    test('returns false for invalid content types', () => {
      expect(Fragment.isSupportedType('invalid')).toBe(false);
      expect(Fragment.isSupportedType('')).toBe(false);
      expect(Fragment.isSupportedType(null)).toBe(false);
      expect(Fragment.isSupportedType(undefined)).toBe(false);
    });
  });

  describe('Fragment constructor', () => {
    test('requires ownerId and type', () => {
      expect(() => new Fragment({})).toThrow('ownerId and type are required');
      expect(() => new Fragment({ ownerId: '123' })).toThrow('ownerId and type are required');
      expect(() => new Fragment({ type: 'text/plain' })).toThrow('ownerId and type are required');
    });

    test('requires non-negative size', () => {
      expect(() => new Fragment({ ownerId: '123', type: 'text/plain', size: -1 })).toThrow('size must be non-negative number');
      expect(() => new Fragment({ ownerId: '123', type: 'text/plain', size: 'invalid' })).toThrow('size must be non-negative number');
    });

    test('requires supported type', () => {
      expect(() => new Fragment({ ownerId: '123', type: 'unsupported/type' })).toThrow('Unsupported type: unsupported/type');
    });

    test('creates fragment with required fields', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      expect(fragment.ownerId).toBe('123');
      expect(fragment.type).toBe('text/plain');
      expect(fragment.size).toBe(0);
      expect(fragment.id).toBeDefined();
      expect(fragment.created).toBeDefined();
      expect(fragment.updated).toBeDefined();
    });

    test('creates fragment with all fields', () => {
      const fragment = new Fragment({
        id: 'test-id',
        ownerId: '123',
        created: '2021-01-01T00:00:00.000Z',
        updated: '2021-01-01T00:00:00.000Z',
        type: 'text/plain',
        size: 100,
      });
      expect(fragment.id).toBe('test-id');
      expect(fragment.ownerId).toBe('123');
      expect(fragment.created).toBe('2021-01-01T00:00:00.000Z');
      expect(fragment.updated).toBe('2021-01-01T00:00:00.000Z');
      expect(fragment.type).toBe('text/plain');
      expect(fragment.size).toBe(100);
    });
  });

  describe('Fragment properties', () => {
    test('mimeType returns correct type', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain; charset=utf-8' });
      expect(fragment.mimeType).toBe('text/plain');
    });

    test('isText returns true for text types', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      expect(fragment.isText).toBe(true);
    });

    test('isText returns false for non-text types', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'image/png' });
      expect(fragment.isText).toBe(false);
    });

    test('isImage returns true for image types', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'image/png' });
      expect(fragment.isImage).toBe(true);
    });

    test('isImage returns false for non-image types', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      expect(fragment.isImage).toBe(false);
    });

    test('formats returns correct formats for text types', () => {
      const plainFragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      expect(plainFragment.formats).toEqual(['text/plain']);

      const mdFragment = new Fragment({ ownerId: '123', type: 'text/markdown' });
      expect(mdFragment.formats).toContain('text/markdown');
      expect(mdFragment.formats).toContain('text/html');
      expect(mdFragment.formats).toContain('text/plain');

      const htmlFragment = new Fragment({ ownerId: '123', type: 'text/html' });
      expect(htmlFragment.formats).toContain('text/html');
      expect(htmlFragment.formats).toContain('text/plain');

      const csvFragment = new Fragment({ ownerId: '123', type: 'text/csv' });
      expect(csvFragment.formats).toContain('text/csv');
      expect(csvFragment.formats).toContain('text/plain');
      expect(csvFragment.formats).toContain('application/json');

      const jsonFragment = new Fragment({ ownerId: '123', type: 'application/json' });
      expect(jsonFragment.formats).toContain('application/json');
      expect(jsonFragment.formats).toContain('application/yaml');
      expect(jsonFragment.formats).toContain('text/plain');

      const yamlFragment = new Fragment({ ownerId: '123', type: 'application/yaml' });
      expect(yamlFragment.formats).toContain('application/yaml');
      expect(yamlFragment.formats).toContain('text/plain');
    });

    test('formats returns correct formats for image types', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'image/png' });
      expect(fragment.formats).toContain('image/png');
      expect(fragment.formats).toContain('image/jpeg');
      expect(fragment.formats).toContain('image/webp');
      expect(fragment.formats).toContain('image/gif');
      expect(fragment.formats).toContain('image/avif');
    });
  });

  describe('Fragment.save()', () => {
    test('saves fragment and updates timestamp', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      const originalUpdated = fragment.updated;
      
      // Add a small delay to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await fragment.save();
      
      expect(writeFragment).toHaveBeenCalledWith(fragment);
      expect(fragment.updated).not.toBe(originalUpdated);
    });
  });

  describe('Fragment.setData()', () => {
    test('requires Buffer data', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      await expect(fragment.setData('not a buffer')).rejects.toThrow('Data must be a Buffer');
    });

    test('sets data and updates size and timestamp', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      const data = Buffer.from('test data');
      const originalSize = fragment.size;
      const originalUpdated = fragment.updated;
      
      await fragment.setData(data);
      
      expect(writeFragmentData).toHaveBeenCalledWith(fragment.ownerId, fragment.id, data);
      expect(writeFragment).toHaveBeenCalledWith(fragment);
      expect(fragment.size).toBe(data.length);
      expect(fragment.size).not.toBe(originalSize);
      expect(fragment.updated).not.toBe(originalUpdated);
    });
  });

  describe('Fragment.getData()', () => {
    test('returns fragment data', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      fragment.getData();
      expect(readFragmentData).toHaveBeenCalledWith(fragment.ownerId, fragment.id);
    });
  });

  describe('Fragment.byUser()', () => {
    test('returns fragments for user', async () => {
      const mockFragments = [
        { id: '1', ownerId: '123', type: 'text/plain' },
        { id: '2', ownerId: '123', type: 'text/markdown' },
      ];
      listFragments.mockResolvedValue(mockFragments);
      
      const fragments = await Fragment.byUser('123');
      
      expect(listFragments).toHaveBeenCalledWith('123', false);
      expect(fragments).toEqual(mockFragments);
    });

    test('returns expanded fragments when expand=true', async () => {
      const mockFragments = [
        { id: '1', ownerId: '123', type: 'text/plain' },
        { id: '2', ownerId: '123', type: 'text/markdown' },
      ];
      listFragments.mockResolvedValue(mockFragments);
      
      const fragments = await Fragment.byUser('123', true);
      
      expect(listFragments).toHaveBeenCalledWith('123', true);
      expect(fragments).toHaveLength(2);
      expect(fragments[0]).toBeInstanceOf(Fragment);
      expect(fragments[1]).toBeInstanceOf(Fragment);
    });
  });

  describe('Fragment.byId()', () => {
    test('returns fragment by id', async () => {
      const mockFragment = { id: '1', ownerId: '123', type: 'text/plain' };
      readFragment.mockResolvedValue(mockFragment);
      
      const fragment = await Fragment.byId('123', '1');
      
      expect(readFragment).toHaveBeenCalledWith('123', '1');
      expect(fragment).toBeInstanceOf(Fragment);
      expect(fragment.id).toBe('1');
    });

    test('returns null when fragment not found', async () => {
      readFragment.mockResolvedValue(null);
      
      const fragment = await Fragment.byId('123', '1');
      
      expect(readFragment).toHaveBeenCalledWith('123', '1');
      expect(fragment).toBeNull();
    });
  });

  describe('Fragment.delete()', () => {
    test('deletes fragment successfully', async () => {
      const mockFragment = { id: '1', ownerId: '123', type: 'text/plain' };
      readFragment.mockResolvedValue(mockFragment);
      deleteFragment.mockResolvedValue(true);
      
      const result = await Fragment.delete('123', '1');
      
      expect(readFragment).toHaveBeenCalledWith('123', '1');
      expect(deleteFragment).toHaveBeenCalledWith('123', '1');
      expect(result).toBe(true);
    });

    test('throws error when fragment not found', async () => {
      readFragment.mockResolvedValue(null);
      
      await expect(Fragment.delete('123', '1')).rejects.toThrow('Fragment not found');
      expect(readFragment).toHaveBeenCalledWith('123', '1');
      expect(deleteFragment).not.toHaveBeenCalled();
    });

    test('throws error when deletion fails', async () => {
      const mockFragment = { id: '1', ownerId: '123', type: 'text/plain' };
      readFragment.mockResolvedValue(mockFragment);
      deleteFragment.mockRejectedValue(new Error('Database error'));
      
      await expect(Fragment.delete('123', '1')).rejects.toThrow('Unable to delete fragment: Database error');
    });
  });

  describe('Fragment.convertTo()', () => {
    test('converts markdown to HTML', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/markdown' });
      const markdownData = Buffer.from('# Test\n**Bold** text');
      readFragmentData.mockResolvedValue(markdownData);
      
      const result = await fragment.convertTo('text/html');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('<h1>Test</h1>');
      expect(result.toString()).toContain('<strong>Bold</strong>');
    });

    test('converts markdown to plain text', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/markdown' });
      const markdownData = Buffer.from('# Test\n**Bold** text');
      readFragmentData.mockResolvedValue(markdownData);
      
      const result = await fragment.convertTo('text/plain');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('Test');
      expect(result.toString()).toContain('Bold text');
    });

    test('converts HTML to plain text', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/html' });
      const htmlData = Buffer.from('<h1>Test</h1><p>Some text</p>');
      readFragmentData.mockResolvedValue(htmlData);
      
      const result = await fragment.convertTo('text/plain');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('TestSome text');
    });

    test('converts CSV to JSON', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/csv' });
      const csvData = Buffer.from('name,age\nJohn,30\nJane,25');
      readFragmentData.mockResolvedValue(csvData);
      
      const result = await fragment.convertTo('application/json');
      
      expect(result).toBeInstanceOf(Buffer);
      const json = JSON.parse(result.toString());
      expect(json).toHaveLength(2);
      expect(json[0]).toEqual({ name: 'John', age: '30' });
      expect(json[1]).toEqual({ name: 'Jane', age: '25' });
    });

    test('converts JSON to YAML', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'application/json' });
      const jsonData = Buffer.from('{"name": "test", "value": 123}');
      readFragmentData.mockResolvedValue(jsonData);
      
      const result = await fragment.convertTo('application/yaml');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('name: test');
      expect(result.toString()).toContain('value: 123');
    });

    test('throws error for unsupported conversion', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      
      await expect(fragment.convertTo('image/png')).rejects.toThrow('Cannot convert text/plain to image/png');
    });

    test('throws error for unsupported text conversion', async () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
      readFragmentData.mockResolvedValue(Buffer.from('test'));
      
      await expect(fragment.convertTo('text/html')).rejects.toThrow('Cannot convert text/plain to text/html');
    });
  });
});
