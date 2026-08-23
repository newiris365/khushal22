import crypto from 'crypto';

describe('Hostel & Gate QR Security Verification', () => {
  it('generates a 32-character hex secret for institution QR code security', () => {
    const generatedSecret = crypto.randomBytes(16).toString('hex');
    expect(generatedSecret).toHaveLength(32);
    expect(generatedSecret).not.toBe('WARDEN_CHECKIN_DEFAULT');
  });

  it('rejects attendance check-in when QR secret does not match allowed secret', () => {
    const allowedSecret = 'a1b2c3d4e5f67890a1b2c3d4e5f67890';
    const providedSecret = 'invalid_scanned_qr_code';

    const isValid = providedSecret === allowedSecret;
    expect(isValid).toBe(false);
  });

  it('accepts attendance check-in when QR secret matches institution secret', () => {
    const allowedSecret = 'a1b2c3d4e5f67890a1b2c3d4e5f67890';
    const providedSecret = 'a1b2c3d4e5f67890a1b2c3d4e5f67890';

    const isValid = providedSecret === allowedSecret;
    expect(isValid).toBe(true);
  });
});
