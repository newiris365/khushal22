import crypto from 'crypto';

const RAW_SECRET = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'iris-365-default-encryption-secret-32-bytes!';
const ENCRYPTION_KEY = crypto.scryptSync(RAW_SECRET, 'iris-365-salt', 32);
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts plaintext string using AES-256-GCM at rest.
 * Output format: enc:<iv_hex>:<tag_hex>:<encrypted_hex>
 */
export function encryptText(plainText: string | null | undefined): string {
  if (!plainText || plainText.trim() === '') return '';
  if (plainText.startsWith('enc:')) return plainText; // already encrypted

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return `enc:${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted string.
 * Gracefully returns legacy plaintext keys if input does not start with "enc:".
 */
export function decryptText(cipherText: string | null | undefined): string {
  if (!cipherText || cipherText.trim() === '') return '';
  if (!cipherText.startsWith('enc:')) return cipherText; // Graceful legacy fallback

  try {
    const parts = cipherText.slice(4).split(':');
    if (parts.length !== 3) return cipherText;

    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt text:', err);
    return '';
  }
}
