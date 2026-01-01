import { encrypt, decrypt, rotateKey, generateKey } from './index.ts';

// 1. Initial Setup
const initialKey = "12345678901234567890123456789012"; // 32 chars
const sensitiveData = "Confidential User PII";

console.log("--- Phase 3: Security Verification ---");
console.log("Original Data:", sensitiveData);

// 2. Initial Encryption
const encrypted = encrypt(sensitiveData, initialKey);
console.log("Encrypted (with Initial Key):", encrypted);

// 3. Verification
const decrypted = decrypt(encrypted, initialKey);
console.log("Decrypted (Verify):", decrypted);

// 4. Key Rotation
const newKey = "09876543210987654321098765432109"; // New 32 chars
const rotatedEncrypted = rotateKey(encrypted, initialKey, newKey);
console.log("Rotated Encryption (New Key):", rotatedEncrypted);

// 5. Final Verification
const finalDecrypted = decrypt(rotatedEncrypted, newKey);
console.log("Decrypted (with New Key):", finalDecrypted);

if (finalDecrypted === sensitiveData) {
  console.log("\nSUCCESS: Key rotation successful. Integrity maintained.");
} else {
  console.log("\nFAILURE: Data corruption during rotation.");
}
