import crypto from "crypto";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface EncryptedPayload {
  iv: string; // Hex string
  authTag: string; // Hex string
  ciphertext: string; // Base64 or Hex
  algorithm: string;
}

export class CryptoService {
  private static ALGORITHM = "aes-256-gcm";
  private static IV_LENGTH = 16;
  private static TAG_LENGTH = 16;

  /**
   * Derive a 32-byte (256-bit) encryption key from the environment secret and salt.
   */
  private static deriveMasterKey(salt: string = "ciphertrust_doc_master_salt"): Buffer {
    const secret = env.JWT_SECRET || "ciphertrust_super_secret_jwt_key_2026";
    return crypto.pbkdf2Sync(secret, salt, 100000, 32, "sha256");
  }

  /**
   * Generate SHA-256 hash of a Buffer or string.
   */
  public static hashBuffer(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Encrypt a Buffer using AES-256-GCM.
   */
  public static encryptBuffer(data: Buffer, documentId?: string): Buffer {
    const key = this.deriveMasterKey(documentId || "ciphertrust_default_salt");
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher: any = crypto.createCipheriv(this.ALGORITHM, key, iv, { authTagLength: this.TAG_LENGTH } as any);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Pack binary payload: [IV (16 bytes)][AuthTag (16 bytes)][Ciphertext]
    const packed = Buffer.concat([iv, authTag, encrypted]);
    logger.debug(`[CryptoService] Encrypted ${data.length} bytes into ${packed.length} bytes payload.`);
    return packed;
  }

  /**
   * Decrypt an AES-256-GCM packed Buffer.
   */
  public static decryptBuffer(packedData: Buffer, documentId?: string): Buffer {
    if (packedData.length < this.IV_LENGTH + this.TAG_LENGTH) {
      throw new Error("Invalid encrypted payload size");
    }

    const key = this.deriveMasterKey(documentId || "ciphertrust_default_salt");
    const iv = packedData.subarray(0, this.IV_LENGTH);
    const authTag = packedData.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
    const ciphertext = packedData.subarray(this.IV_LENGTH + this.TAG_LENGTH);

    const decipher: any = crypto.createDecipheriv(this.ALGORITHM, key, iv, { authTagLength: this.TAG_LENGTH } as any);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    logger.debug(`[CryptoService] Decrypted payload into ${decrypted.length} bytes.`);
    return decrypted;
  }
}
