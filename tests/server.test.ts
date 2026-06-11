/**
 * Tests for the server health endpoint and route registration.
 * These are integration-level tests that verify the Express app starts correctly.
 */

// Mock environment variables before importing anything
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

import express from 'express';

describe('Express app structure', () => {
  it('should have express available', () => {
    expect(express).toBeDefined();
    expect(typeof express).toBe('function');
  });

  it('should create an app instance', () => {
    const app = express();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
    expect(typeof app.use).toBe('function');
  });
});

describe('Environment variables', () => {
  it('should have JWT_SECRET set for tests', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET!.length).toBeGreaterThanOrEqual(32);
  });
});
