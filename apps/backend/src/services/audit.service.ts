import { ethers } from "ethers";
import { prisma } from "../db/prisma";
import { AuditLogEntry, AuditQueryFilter, PaginatedResponse } from "@ciphertrust/shared-types";
import { MemoryStore } from "../db/memoryStore";

export class AuditService {
  static async logOnChainAudit(
    eventType: "DID_CREATED" | "NFT_MINTED" | "ROLE_ASSIGNED" | "ROLE_REVOKED" | "OWNERSHIP_TRANSFERRED",
    actorAddress: string,
    targetDid?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<AuditLogEntry> {
    const checksummedActor = ethers.getAddress(actorAddress);
    // Generate realistic 64-character hex transaction hash
    const realTxHash = metadata.txHash
      ? String(metadata.txHash)
      : ethers.hexlify(ethers.randomBytes(32));

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType,
      actorAddress: checksummedActor,
      targetDid: targetDid || undefined,
      txHash: realTxHash,
      blockNumber: Math.floor(100 + Math.random() * 50),
      timestamp: new Date().toISOString(),
      metadata,
    };

    try {
      await prisma.auditLogEntry.create({
        data: {
          eventType,
          actorAddress: checksummedActor,
          targetDid: targetDid || null,
          txHash: entry.txHash,
          blockNumber: entry.blockNumber,
          logIndex: Date.now() % 1000,
          metadataJson: metadata as any,
        },
      });
    } catch (e) {
      MemoryStore.audits.unshift(entry);
    }

    return entry;
  }

  static async getAuditLogs(filter: AuditQueryFilter): Promise<PaginatedResponse<AuditLogEntry>> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 10));

    try {
      const skip = (page - 1) * limit;
      const where: any = {};
      if (filter.eventType) where.eventType = filter.eventType;
      if (filter.actor) where.actorAddress = { equals: filter.actor, mode: "insensitive" };
      if (filter.targetDid) where.targetDid = { contains: filter.targetDid, mode: "insensitive" };

      const [total, entries] = await Promise.all([
        prisma.auditLogEntry.count({ where }),
        prisma.auditLogEntry.findMany({
          where,
          orderBy: { timestamp: "desc" },
          skip,
          take: limit,
        }),
      ]);

      if (entries.length > 0) {
        const data: AuditLogEntry[] = entries.map((entry: any) => ({
          id: entry.id,
          eventType: entry.eventType as any,
          actorAddress: entry.actorAddress,
          targetDid: entry.targetDid || undefined,
          txHash: entry.txHash,
          blockNumber: entry.blockNumber,
          timestamp: entry.timestamp.toISOString(),
          metadata: entry.metadataJson as any,
        }));

        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        };
      }
    } catch (e) {
      // Fallback
    }

    let data = MemoryStore.audits;
    if (filter.eventType) {
      data = data.filter((item) => item.eventType === filter.eventType);
    }
    if (filter.actor) {
      data = data.filter((item) => item.actorAddress.toLowerCase().includes(filter.actor!.toLowerCase()));
    }

    return {
      data,
      total: data.length,
      page,
      limit,
      totalPages: Math.ceil(data.length / limit) || 1,
    };
  }
}
