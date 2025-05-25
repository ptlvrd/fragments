const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const logger = require('./logger');
const { createErrorResponse } = require('./response');
const pino = require('pino-http')({ logger });

const authenticate = require('./auth');

// Create app
const app = express();

// Middleware
app.use(pino);
app.use(helmet());
app.use(cors());
app.use(compression());

// Passport setup
passport.use(authenticate.strategy());
app.use(passport.initialize());

// Routes
app.use('/', require('./routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});


// Error handler
app.use((err, req, res) => {
  const status = err.status || 500;
  const message = err.message || 'unable to process request';
  if (status > 499) logger.error({ err }, `Error processing request`);

  res.status(status).json(createErrorResponse(status, message));

});

module.exports = app;
