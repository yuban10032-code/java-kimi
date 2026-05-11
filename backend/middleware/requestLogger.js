const db = require('../config/database');

function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?.userId || null,
    };

    // Log slow requests (> 1s)
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.path} - ${duration}ms`);
    }

    // Log errors
    if (res.statusCode >= 400) {
      console.error(`[ERROR] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
}

module.exports = { requestLogger };
