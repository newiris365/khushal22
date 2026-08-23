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

// Dedicated per-user rate limit for AI Concierge chat endpoint to prevent LLM bill spikes
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // max 20 requests per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
  message: {
    success: false,
    error: 'Rate limit exceeded: Maximum 20 AI queries per minute per user.',
    response: '⏳ You have reached the rate limit of 20 queries per minute. Please pause for a moment before sending another query.'
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

// Dedicated rate limit for parent-child linking to prevent brute-force DOB guessing
export const parentLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // max 5 verification attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
  message: {
    success: false,
    error: 'Too many child linking verification attempts. Please wait 15 minutes before trying again.'
  }
});
