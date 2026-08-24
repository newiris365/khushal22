export interface RazorpayClient {
  orders: {
    create: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
    [key: string]: unknown;
  };
  payments: {
    fetch: (paymentId: string) => Promise<Record<string, unknown>>;
    refund: (paymentId: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

let razorpayInstance: RazorpayClient | null = null;

export function getRazorpayClient(): RazorpayClient | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.includes('your_key')) {
    return null;
  }

  if (!razorpayInstance) {
    try {
      // eslint-disable-next-line
      const Razorpay = require('razorpay');
      razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } catch {
      return null;
    }
  }

  return razorpayInstance;
}

export function isMockOrderId(orderId: string): boolean {
  return orderId.startsWith('order_mock_');
}
