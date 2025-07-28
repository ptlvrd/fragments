/**
 * Data Model Index
 * 
 * This module exports the appropriate data model based on environment configuration.
 * If AWS_REGION is set in the environment, it uses the AWS backend (S3, DynamoDB).
 * Otherwise, it falls back to the in-memory database.
 */

// If the environment sets an AWS Region, we'll use AWS backend
// services (S3, DynamoDB); otherwise, we'll use an in-memory db.
module.exports = process.env.AWS_REGION ? require('./aws') : require('./memory');