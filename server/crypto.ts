import crypto from "crypto";
import { ENV } from "./_core/env";

/**
 * Encryption configuration
 * Uses AES-256-CBC for strong encryption
 */
const ALGORITHM = "aes-256-cbc";

/**
 * Get the encryption key from environment variables
 * The key should be a 64-character hex string (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_SECRET;
  
  if (!keyHex) {
    throw new Error(
      "ENCRYPTION_SECRET environment variable is not set. " +
      "Generate a 32-byte hex key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  if (keyHex.length !== 64) {
    throw new Error(
      `ENCRYPTION_SECRET must be a 64-character hex string (32 bytes), got ${keyHex.length} characters`
    );
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-CBC
 * Returns a string in format: IV:ENCRYPTED_DATA (both in hex)
 * 
 * @param plaintext - The text to encrypt (e.g., API key)
 * @returns Encrypted string in format "IV:HEX_DATA"
 */
export function encryptApiKey(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    
    // Generate a random initialization vector for each encryption
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the plaintext
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf-8"),
      cipher.final(),
    ]);
    
    // Return IV:ENCRYPTED in hex format
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Decrypt an encrypted string back to plaintext
 * Expects input in format: IV:ENCRYPTED_DATA (both in hex)
 * 
 * @param encryptedText - The encrypted string in format "IV:HEX_DATA"
 * @returns The decrypted plaintext
 */
export function decryptApiKey(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    
    // Parse the IV and encrypted data
    const [ivHex, dataHex] = encryptedText.split(":");
    
    if (!ivHex || !dataHex) {
      throw new Error("Invalid encrypted format. Expected 'IV:DATA'");
    }
    
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(dataHex, "hex");
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted.toString("utf-8");
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Verify that the encryption key is properly configured
 * Call this during application startup to fail fast if encryption is misconfigured
 */
export function verifyEncryptionSetup(): boolean {
  try {
    const testKey = "test-api-key-12345";
    const encrypted = encryptApiKey(testKey);
    const decrypted = decryptApiKey(encrypted);
    
    if (decrypted !== testKey) {
      throw new Error("Encryption/decryption roundtrip failed");
    }
    
    return true;
  } catch (error) {
    console.error("Encryption setup verification failed:", error);
    return false;
  }
}
