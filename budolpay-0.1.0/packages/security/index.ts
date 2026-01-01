import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a string using AES-256-CBC.
 * The encryption key should be a 32-byte string (256 bits).
 */
export function encrypt(text: string, secretKey: string): string {
  if (secretKey.length !== 32) {
    throw new Error('Secret key must be exactly 32 characters (256 bits).');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Return IV and encrypted data as hex, separated by a colon
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts an AES-256-CBC encrypted string.
 */
export function decrypt(text: string, secretKey: string): string {
  if (secretKey.length !== 32) {
    throw new Error('Secret key must be exactly 32 characters (256 bits).');
  }

  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey), iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

/**
 * Re-encrypts data with a new key.
 * Useful for automated key rotation schedules.
 */
export function rotateKey(
  encryptedText: string,
  oldKey: string,
  newKey: string
): string {
  const decrypted = decrypt(encryptedText, oldKey);
  return encrypt(decrypted, newKey);
}

/**
 * Generates a random 32-character secret key.
 * Use this to generate a key for your .env file.
 */
export function generateKey(): string {
  return crypto.randomBytes(16).toString('hex'); // 32 characters
}
