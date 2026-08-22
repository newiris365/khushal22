import rateLimit from 'express-rate-limit';

// Strict rate limit for authentication endpoints (prevents brute-force)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait 60 seconds before trying again.'
  }
});

// Dedicated rate limit for SMS/WhatsApp OTP generation to block flood/brute attacks
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // max 3 OTP requests per 15 minutes per IP/number
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Limit by phone number if present in request body, fallback to IP
    return (req.body && req.body.phone) ? String(req.body.phone) : req.ip;
  },
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again after 15 minutes.'
  }
});

// Standard rate limit for write/mutation endpoints
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 writes per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded. Maximum 30 write requests per minute.'
  }
});

// Relaxed rate limit for read endpoints
export const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 reads per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded. Maximum 100 read requests per minute.'
  }
});

// Global catch-all rate limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Global rate limit exceeded. Please try again later.'
  }
});
