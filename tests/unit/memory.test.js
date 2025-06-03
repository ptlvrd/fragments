const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  deleteFragment,
  listFragments,
} = require('../../src/model/data/memory');

describe('Memory Fragment Data Model', () => {
  const ownerId = 'user123';
  const fragmentId = 'fragment123';
  const metadata = { id: fragmentId, ownerId, type: 'text/plain', size: 5 };
  const data = Buffer.from('hello');

  test('writeFragment and readFragment', async () => {
    await writeFragment(metadata);
    const result = await readFragment(ownerId, fragmentId);
    expect(result).toEqual(metadata);
  });

  test('writeFragmentData and readFragmentData', async () => {
    await writeFragmentData(ownerId, fragmentId, data);
    const result = await readFragmentData(ownerId, fragmentId);
    expect(result).toEqual(data);
  });

  test('listFragments returns ids if expand=false', async () => {
    const fragments = await listFragments(ownerId);
    expect(fragments).toContain(fragmentId);
  });

  test('listFragments returns full metadata if expand=true', async () => {
    const fragments = await listFragments(ownerId, true);
    expect(fragments).toEqual(expect.arrayContaining([metadata]));
  });

  test('deleteFragment removes both metadata and data', async () => {
    await deleteFragment(ownerId, fragmentId);
    const meta = await readFragment(ownerId, fragmentId);
    const fragData = await readFragmentData(ownerId, fragmentId);
    expect(meta).toBeUndefined();
    expect(fragData).toBeUndefined();
  });
});
