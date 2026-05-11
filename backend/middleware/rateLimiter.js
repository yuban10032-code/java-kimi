class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(identifier) {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return { allowed: false, retryAfter: Math.ceil((recentRequests[0] + this.windowMs - now) / 1000) };
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return { allowed: true };
  }
}

const apiLimiter = new RateLimiter(100, 60000);
const authLimiter = new RateLimiter(10, 60000);

function rateLimit(type = 'api') {
  const limiter = type === 'auth' ? authLimiter : apiLimiter;
  
  return (req, res, next) => {
    const identifier = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const result = limiter.check(identifier);
    
    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: result.retryAfter,
      });
    }
    
    next();
  };
}

module.exports = { rateLimit };
