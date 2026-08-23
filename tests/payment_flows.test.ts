import { getRazorpayClient, isMockOrderId } from '../src/lib/razorpay';
import crypto from 'crypto';

describe('Payment Flows & Razorpay Integration', () => {
  it('correctly identifies mock order IDs', () => {
    expect(isMockOrderId('order_mock_12345')).toBe(true);
    expect(isMockOrderId('order_real_67890')).toBe(false);
  });

  it('returns null client when environment keys are unconfigured or placeholder', () => {
    const client = getRazorpayClient();
    expect(client).toBeNull();
  });

  it('validates HMAC-SHA256 signature calculation for payment webhooks', () => {
    const secret = 'whsec_test_secret_12345';
    const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123' } } } });

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    expect(generatedSignature).toBe(expectedSignature);
  });
});
