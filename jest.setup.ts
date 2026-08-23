// Global Jest environment setup for IRIS 365 test suites
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder-test-url.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key-32-chars-long';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-at-least-32-characters-long';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-secret-32-bytes!';
process.env.ALLOW_MOCK_AUTH = 'true';
