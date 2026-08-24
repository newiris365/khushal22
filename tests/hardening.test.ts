process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authMiddleware } from '../src/middleware/auth';
import { razorpayWebhook } from '../src/controllers/campusCore';
import { supabaseAdmin } from '../src/config/supabase';
import { validateFileMetadata } from '../src/lib/file-validation';

const JWT_SECRET = process.env.JWT_SECRET;

function makeReq(overrides: Record<string, any> = {}) {
  return {
    headers: {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Hardening - JWT Role Casing Normalization', () => {
  it('should normalize lowercase director role to Director', () => {
    const payload = {
      id: 'user-123',
      institution_id: 'inst-1',
      role: 'director',
      email: 'director@siet.edu.in',
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.role).toBe('Director');
  });

  it('should normalize lowercase superadmin role to SuperAdmin', () => {
    const payload = {
      id: 'user-123',
      institution_id: 'inst-1',
      role: 'superadmin',
      email: 'siddharth@sin.education',
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.role).toBe('SuperAdmin');
  });
});

describe('Hardening - Razorpay Webhook Multi-Module Reconciliation', () => {
  it('should return 200 and ignore webhook payments missing metadata notes', async () => {
    const req = makeReq({
      headers: { 'x-razorpay-signature': 'mock-sig' },
      body: {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 50000,
              notes: {}
            }
          }
        }
      }
    });
    const res = makeRes();

    const secret = 'test_webhook_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    const bodyStr = JSON.stringify(req.body);
    const signature = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
    req.headers['x-razorpay-signature'] = signature;
    req.rawBody = bodyStr;

    await razorpayWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('Ignored')
      })
    );
  });

  it('should reject webhook with 503 when RAZORPAY_WEBHOOK_SECRET is missing', async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    delete process.env.RAZORPAY_KEY_SECRET;

    const req = makeReq({
      headers: { 'x-razorpay-signature': 'any_sig' },
      body: { event: 'payment.captured' }
    });
    const res = makeRes();

    await razorpayWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('secret is not configured')
      })
    );
  });

  it('should reject webhook with 400 on invalid signature or timing-safe mismatch', async () => {
    const secret = 'test_webhook_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;

    const req = makeReq({
      headers: { 'x-razorpay-signature': 'invalid_signature_hex_digest_mismatch' },
      body: { event: 'payment.captured' },
      rawBody: JSON.stringify({ event: 'payment.captured' })
    });
    const res = makeRes();

    await razorpayWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid webhook signature.'
      })
    );
  });
});

describe('Hardening - httpOnly Cookie Authentication', () => {
  it('should authenticate user via req.cookies.iris_jwt_token end to end', () => {
    const validToken = jwt.sign(
      { id: 'user-cookie-1', institution_id: 'inst-1', role: 'Student', email: 'student@example.com' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const req = makeReq({
      cookies: { iris_jwt_token: validToken },
      headers: {}
    });
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-cookie-1');
  });
});

describe('Hardening - Server-Side File Upload Metadata Validation', () => {
  it('should reject disallowed file types server-side', () => {
    const res = validateFileMetadata({
      file_url: 'https://supabase.co/storage/v1/object/public/kyc/malicious.exe',
      file_type: 'application/x-msdownload'
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Invalid file_type');
  });

  it('should reject oversized files exceeding server max size limit', () => {
    const res = validateFileMetadata({
      file_url: 'https://supabase.co/storage/v1/object/public/docs/large.pdf',
      file_size_kb: 50000 // 50MB, exceeds 10MB limit
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Maximum permitted file size');
  });

  it('should reject file_url from invalid storage bucket pattern', () => {
    const res = validateFileMetadata({
      file_url: 'https://evil-attacker.com/malicious.pdf',
      file_type: 'application/pdf'
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('bucket pattern');
  });
});

describe('Hardening - Supabase Auth Password Hashing Audit', () => {
  it('should confirm authentication delegates purely to Supabase Auth without custom password storage', () => {
    const authControllerContent = require('fs').readFileSync('src/controllers/auth.ts', 'utf-8');
    expect(authControllerContent).toContain('supabaseAdmin.auth.signInWithPassword');
    expect(authControllerContent).not.toContain('bcrypt');
    expect(authControllerContent).not.toContain('crypto.createHash');
  });
});

describe('Hardening - Zod Input Validation on Mutating Routes Audit', () => {
  it('should verify serviceSubscriptions mutating routes validate input with Zod', () => {
    const routeContent = require('fs').readFileSync('src/routes/serviceSubscriptions.ts', 'utf-8');
    expect(routeContent).toContain('pricingPlanSchema.safeParse');
    expect(routeContent).toContain('initiateSubscriptionSchema.safeParse');
    expect(routeContent).toContain('verifySubscriptionSchema.safeParse');
  });
});
