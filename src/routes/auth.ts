import { Router } from 'express';
import { login, getMe, refresh, forgotPassword, logout, parentLinkChild, parentOtp, parentVerifyOtp } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimit';

const router = Router();

// Public login & token management endpoints
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/logout', logout);

// Parent OTP generation & verification endpoints
router.post('/parent/otp', otpLimiter, parentOtp);
router.post('/parent/verify-otp', authLimiter, parentVerifyOtp);

// Parent linking endpoint (direct - no OTP required)
router.post('/parent-link-child', authMiddleware, parentLinkChild);

// Protected token validation endpoint
router.get('/me', authMiddleware, getMe);

export default router;
