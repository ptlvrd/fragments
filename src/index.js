// src/index.js
const unused = 'break eslint';

require('dotenv').config(); // <-- Load .env variables first
const logger = require('./logger');

// Handle crashes
process.on('uncaughtException', (err, origin) => {
  logger.fatal({ err, origin }, 'uncaughtException');
  throw err;
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'unhandledRejection');
  throw reason;
});

// Start the server
require('./server');
