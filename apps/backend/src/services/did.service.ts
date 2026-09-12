import { ethers } from "ethers";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { DIDDocument, Role } from "@ciphertrust/shared-types";
import { MemoryStore } from "../db/memoryStore";

export class DidService {
  static formatDid(address: string): string {
    const checksummed = ethers.getAddress(address);
    return `did:ethr:${env.CHAIN_ID}:${checksummed}`;
  }

  static async createDid(controllerAddress: string): Promise<DIDDocument> {
    const address = ethers.getAddress(controllerAddress);
    const did = this.formatDid(address);

    const doc: DIDDocument = {
      did,
      controllerAddress: address,
      publicKey: `pub_${address}`,
      createdAt: new Date().toISOString(),
      verified: true,
    };

    try {
      await prisma.user.upsert({
        where: { address },
        update: {},
        create: { address },
      });

      const dbDoc = await prisma.didDocument.upsert({
        where: { did },
        update: {},
        create: {
          did,
          controllerAddress: address,
          publicKey: `pub_${address}`,
          verified: true,
        },
      });

      return {
        did: dbDoc.did,
        controllerAddress: dbDoc.controllerAddress,
        publicKey: dbDoc.publicKey,
        createdAt: dbDoc.createdAt.toISOString(),
        verified: dbDoc.verified,
      };
    } catch (e) {
      MemoryStore.users.add(address);
      MemoryStore.dids.set(did.toLowerCase(), doc);
      return doc;
    }
  }

  static async getDid(didOrAddress: string): Promise<DIDDocument | null> {
    let did = didOrAddress;
    if (!didOrAddress.startsWith("did:ethr:")) {
      did = this.formatDid(didOrAddress);
    }

    try {
      const doc = await prisma.didDocument.findUnique({
        where: { did },
      });

      if (doc) {
        return {
          did: doc.did,
          controllerAddress: doc.controllerAddress,
          publicKey: doc.publicKey,
          createdAt: doc.createdAt.toISOString(),
          verified: doc.verified,
        };
      }
    } catch (e) {
      // Fallback to memory store
    }

    const memDoc = MemoryStore.dids.get(did.toLowerCase());
    if (memDoc) return memDoc;

    // Default fallback document
    const controllerAddr = did.split(":").pop() || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    return {
      did,
      controllerAddress: controllerAddr,
      publicKey: `pub_${controllerAddr}`,
      createdAt: new Date().toISOString(),
      verified: true,
    };
  }
}
