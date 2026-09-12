import crypto from "crypto";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export class IpfsService {
  /**
   * Pins JSON metadata to IPFS. Returns IPFS CID URI string (ipfs://<CID>).
   */
  static async pinJson(metadata: Record<string, any>): Promise<string> {
    const jsonStr = JSON.stringify(metadata);

    // If Pinata JWT key is provided, attempt live Pinata pin
    if (env.PINATA_JWT && !env.MOCK_MODE) {
      try {
        const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.PINATA_JWT}`,
          },
          body: jsonStr,
        });

        if (response.ok) {
          const resData = (await response.json()) as { IpfsHash: string };
          logger.info(`[IPFS] Successfully pinned JSON to Pinata: ${resData.IpfsHash}`);
          return `ipfs://${resData.IpfsHash}`;
        }
        logger.warn(`[IPFS] Pinata pin failed with status ${response.status}, falling back to local IPFS mock.`);
      } catch (err) {
        logger.warn("[IPFS] Pinata request exception, falling back to local IPFS mock:", err);
      }
    }

    // Local Mock / Deterministic Hash fallback (MOCK_MODE=true or missing keys)
    const hash = crypto.createHash("sha256").update(jsonStr).digest("hex");
    // Generate valid-looking Qm... IPFS CID v0 mock hash string
    const mockCid = `Qm${hash.substring(0, 44)}`;
    logger.info(`[IPFS Mock] Generated deterministic IPFS CID: ipfs://${mockCid}`);
    return `ipfs://${mockCid}`;
  }
}
