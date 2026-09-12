import { ethers } from "ethers";
import { env } from "../config/env";
import { getContractDeployments } from "../config/contracts";
import { prisma } from "../db/prisma";
import { logger } from "../utils/logger";

export class ChainListener {
  private isRunning = false;

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info("[ChainListener] Initializing Web3 contract event listener...");

    try {
      const provider = new ethers.JsonRpcProvider(env.RPC_URL);
      const deployments = getContractDeployments();

      const rbacConfig = deployments.contracts.CipherTrustRBAC;
      const nftConfig = deployments.contracts.CipherTrustNFT;
      const auditConfig = deployments.contracts.CipherTrustAudit;

      if (!rbacConfig.abi || rbacConfig.abi.length === 0) {
        logger.warn("[ChainListener] Contract ABIs missing or empty in deployment config. Event listener operating in standby mode.");
        return;
      }

      // 1. RBAC Contract Listener
      const rbacContract = new ethers.Contract(rbacConfig.address, rbacConfig.abi, provider);
      
      rbacContract.on("RoleAssignedByAdmin", async (account: string, role: string, assignedBy: string, event: any) => {
        try {
          logger.info(`[Event: RoleAssignedByAdmin] Account: ${account}, RoleHash: ${role}, By: ${assignedBy}`);
          await prisma.auditLogEntry.upsert({
            where: {
              txHash_logIndex: {
                txHash: event.log.transactionHash,
                logIndex: event.log.index,
              },
            },
            update: {},
            create: {
              eventType: "ROLE_ASSIGNED",
              actorAddress: assignedBy,
              targetDid: `did:ethr:${env.CHAIN_ID}:${account}`,
              txHash: event.log.transactionHash,
              blockNumber: event.log.blockNumber,
              logIndex: event.log.index,
              metadataJson: { role, account, assignedBy },
            },
          });
        } catch (err) {
          logger.error("[ChainListener] Error handling RoleAssignedByAdmin event:", err);
        }
      });

      rbacContract.on("RoleRevokedByAdmin", async (account: string, role: string, revokedBy: string, event: any) => {
        try {
          logger.info(`[Event: RoleRevokedByAdmin] Account: ${account}, RoleHash: ${role}, By: ${revokedBy}`);
          await prisma.auditLogEntry.upsert({
            where: {
              txHash_logIndex: {
                txHash: event.log.transactionHash,
                logIndex: event.log.index,
              },
            },
            update: {},
            create: {
              eventType: "ROLE_REVOKED",
              actorAddress: revokedBy,
              targetDid: `did:ethr:${env.CHAIN_ID}:${account}`,
              txHash: event.log.transactionHash,
              blockNumber: event.log.blockNumber,
              logIndex: event.log.index,
              metadataJson: { role, account, revokedBy },
            },
          });
        } catch (err) {
          logger.error("[ChainListener] Error handling RoleRevoked event:", err);
        }
      });

      // 2. NFT Contract Listener
      const nftContract = new ethers.Contract(nftConfig.address, nftConfig.abi, provider);

      nftContract.on("OwnershipTransferredWithDid", async (tokenId: bigint, from: string, to: string, didLinked: string, event: any) => {
        try {
          logger.info(`[Event: OwnershipTransferredWithDid] TokenId: ${tokenId}, From: ${from}, To: ${to}, DID: ${didLinked}`);
          const eventType = from === ethers.ZeroAddress ? "NFT_MINTED" : "OWNERSHIP_TRANSFERRED";
          
          await prisma.auditLogEntry.upsert({
            where: {
              txHash_logIndex: {
                txHash: event.log.transactionHash,
                logIndex: event.log.index,
              },
            },
            update: {},
            create: {
              eventType,
              actorAddress: from === ethers.ZeroAddress ? to : from,
              targetDid: didLinked,
              txHash: event.log.transactionHash,
              blockNumber: event.log.blockNumber,
              logIndex: event.log.index,
              metadataJson: { tokenId: tokenId.toString(), from, to, didLinked },
            },
          });
        } catch (err) {
          logger.error("[ChainListener] Error handling OwnershipTransferredWithDid event:", err);
        }
      });

      // 3. Audit Contract Listener
      const auditContract = new ethers.Contract(auditConfig.address, auditConfig.abi, provider);

      auditContract.on("AuditLogged", async (eventTypeHash: string, actor: string, targetDid: string, timestamp: bigint, index: bigint, event: any) => {
        try {
          logger.info(`[Event: AuditLogged] EventHash: ${eventTypeHash}, Actor: ${actor}, TargetDID: ${targetDid}`);
          await prisma.auditLogEntry.upsert({
            where: {
              txHash_logIndex: {
                txHash: event.log.transactionHash,
                logIndex: event.log.index,
              },
            },
            update: {},
            create: {
              eventType: "ON_CHAIN_AUDIT",
              actorAddress: actor,
              targetDid: targetDid || null,
              txHash: event.log.transactionHash,
              blockNumber: event.log.blockNumber,
              logIndex: event.log.index,
              metadataJson: { eventTypeHash, timestamp: timestamp.toString(), onChainIndex: index.toString() },
            },
          });
        } catch (err) {
          logger.error("[ChainListener] Error handling AuditLogged event:", err);
        }
      });

      logger.info("[ChainListener] Successfully subscribed to all Web3 contract events.");
    } catch (err) {
      logger.error("[ChainListener] Exception during initialization:", err);
      // Retry connection after backoff
      setTimeout(() => this.start(), 10000);
    }
  }
}
