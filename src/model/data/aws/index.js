const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../../logger');
const MemoryDB = require('../memory/memory-db');

// Convert stream to buffer utility function
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Write fragment metadata to memory DB (temporary until DynamoDB is implemented)
function writeFragment(fragment) {
  const serialized = JSON.stringify(fragment);
  return MemoryDB.put(fragment.ownerId, fragment.id, serialized);
}

// Read fragment metadata from memory DB
async function readFragment(ownerId, id) {
  const serialized = await MemoryDB.get(ownerId, id);
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

// Write fragment data to S3
async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

// Read fragment data from S3
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const command = new GetObjectCommand(params);

  try {
    const data = await s3Client.send(command);
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

// List fragments from memory DB
async function listFragments(ownerId, expand = false) {
  const fragments = await MemoryDB.query(ownerId);
  const parsedFragments = fragments.map((fragment) => JSON.parse(fragment));

  if (expand || !fragments) {
    return parsedFragments;
  }

  return parsedFragments.map((fragment) => fragment.id);
}

// Delete fragment metadata from memory DB and data from S3
async function deleteFragment(ownerId, id) {
  try {
    logger.debug(`Deleting fragment ${ownerId}/${id}`);
    
    // Delete from S3
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${ownerId}/${id}`
    };
    await s3Client.send(new DeleteObjectCommand(s3Params));
    
    // Delete metadata from memory
    await MemoryDB.del(ownerId, id);
    
    return true;
  } catch (err) {
    logger.error({ err, ownerId, id }, 'Failed to delete fragment');
    throw new Error('Failed to delete fragment data');
  }
}

module.exports = {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};