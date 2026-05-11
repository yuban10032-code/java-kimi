const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', details: err.message });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry', details: err.detail });
  }

  if (err.code === '23503') {
    return res.status(409).json({ error: 'Foreign key violation', details: err.detail });
  }

  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Invalid data format', details: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
