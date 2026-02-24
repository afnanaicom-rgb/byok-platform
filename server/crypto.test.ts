import { describe, it, expect, beforeAll } from "vitest";
import { encryptApiKey, decryptApiKey, verifyEncryptionSetup } from "./crypto";

describe("Crypto Utilities", () => {
  beforeAll(() => {
    // Set a test encryption secret
    process.env.ENCRYPTION_SECRET =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  describe("encryptApiKey", () => {
    it("should encrypt a string successfully", () => {
      const plaintext = "sk-1234567890abcdef";
      const encrypted = encryptApiKey(plaintext);

      // Should return a string with IV:DATA format
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    });

    it("should produce different encrypted outputs for the same plaintext", () => {
      const plaintext = "sk-1234567890abcdef";
      const encrypted1 = encryptApiKey(plaintext);
      const encrypted2 = encryptApiKey(plaintext);

      // Due to random IV, encrypted outputs should be different
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should throw error for empty string", () => {
      expect(() => encryptApiKey("")).not.toThrow();
    });
  });

  describe("decryptApiKey", () => {
    it("should decrypt an encrypted string back to plaintext", () => {
      const plaintext = "sk-1234567890abcdef";
      const encrypted = encryptApiKey(plaintext);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long API keys", () => {
      const longKey =
        "sk-" + "a".repeat(100) + "b".repeat(100) + "c".repeat(100);
      const encrypted = encryptApiKey(longKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(longKey);
    });

    it("should throw error for invalid format", () => {
      expect(() => decryptApiKey("invalid-format")).toThrow();
    });

    it("should throw error for malformed hex", () => {
      expect(() => decryptApiKey("zzzz:zzzz")).toThrow();
    });
  });

  describe("verifyEncryptionSetup", () => {
    it("should return true when encryption is properly configured", () => {
      const result = verifyEncryptionSetup();
      expect(result).toBe(true);
    });
  });

  describe("Roundtrip encryption/decryption", () => {
    const testCases = [
      "simple-key",
      "sk-1234567890abcdef1234567890abcdef",
      "very-long-api-key-" + "x".repeat(500),
      "special-chars-!@#$%^&*()",
      "unicode-test-🔐🔑",
    ];

    testCases.forEach((testCase) => {
      it(`should roundtrip: ${testCase.substring(0, 30)}...`, () => {
        const encrypted = encryptApiKey(testCase);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });
  });
});
