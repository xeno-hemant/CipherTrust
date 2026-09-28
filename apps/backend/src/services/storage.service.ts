import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

export class StorageService {
  private static storageDir = path.resolve(__dirname, "../../storage/encrypted");

  /**
   * Ensures the storage directory exists.
   */
  private static ensureDirExists() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      logger.info(`[StorageService] Created storage directory at ${this.storageDir}`);
    }
  }

  /**
   * Write an encrypted payload buffer to off-chain file storage.
   * Returns relative storage key / filename.
   */
  public static async saveEncryptedFile(documentId: string, encryptedBuffer: Buffer): Promise<string> {
    this.ensureDirExists();
    const filename = `${documentId}.enc`;
    const filePath = path.join(this.storageDir, filename);

    await fs.promises.writeFile(filePath, encryptedBuffer);
    logger.info(`[StorageService] Saved encrypted file: ${filePath} (${encryptedBuffer.length} bytes)`);
    return filename;
  }

  /**
   * Read an encrypted payload buffer from off-chain file storage.
   */
  public static async readEncryptedFile(storageKey: string): Promise<Buffer> {
    this.ensureDirExists();
    const filePath = path.join(this.storageDir, path.basename(storageKey));

    if (!fs.existsSync(filePath)) {
      throw new Error(`Storage file not found: ${storageKey}`);
    }

    const buffer = await fs.promises.readFile(filePath);
    logger.debug(`[StorageService] Read encrypted file: ${filePath} (${buffer.length} bytes)`);
    return buffer;
  }

  /**
   * Delete an encrypted file from storage.
   */
  public static async deleteEncryptedFile(storageKey: string): Promise<boolean> {
    try {
      this.ensureDirExists();
      const filePath = path.join(this.storageDir, path.basename(storageKey));
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info(`[StorageService] Deleted storage file: ${filePath}`);
        return true;
      }
      return false;
    } catch (err: any) {
      logger.warn(`[StorageService] Failed to delete file ${storageKey}:`, err.message || err);
      return false;
    }
  }
}
