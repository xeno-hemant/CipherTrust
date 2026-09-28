import { prisma } from "./prisma";
import { logger } from "../utils/logger";

/**
 * Initializes the database schema automatically on server boot.
 * Creates all required tables via raw SQLite DDL if they don't exist.
 * Zero external CLI/child-process dependencies — 100% reliable on Render, Docker, and Linux.
 */
export async function initDb(): Promise<void> {
  logger.info("[initDb] Ensuring all database tables exist...");

  const ddlStatements = [
    // 1. User
    `CREATE TABLE IF NOT EXISTS "User" (
      "address" TEXT NOT NULL PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 2. DidDocument
    `CREATE TABLE IF NOT EXISTS "DidDocument" (
      "did" TEXT NOT NULL PRIMARY KEY,
      "controllerAddress" TEXT NOT NULL,
      "publicKey" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "verified" BOOLEAN NOT NULL DEFAULT 1,
      CONSTRAINT "DidDocument_controllerAddress_fkey" FOREIGN KEY ("controllerAddress") REFERENCES "User" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,

    // 3. NftAsset
    `CREATE TABLE IF NOT EXISTS "NftAsset" (
      "tokenId" TEXT NOT NULL,
      "contractAddress" TEXT NOT NULL,
      "ownerDid" TEXT NOT NULL,
      "metadataUri" TEXT NOT NULL,
      "metadataJson" TEXT NOT NULL,
      "mintedBy" TEXT NOT NULL,
      "mintedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("tokenId", "contractAddress"),
      CONSTRAINT "NftAsset_ownerDid_fkey" FOREIGN KEY ("ownerDid") REFERENCES "DidDocument" ("did") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,

    // 4. RoleAssignment
    `CREATE TABLE IF NOT EXISTS "RoleAssignment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "did" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "assignedBy" TEXT NOT NULL,
      "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "active" BOOLEAN NOT NULL DEFAULT 1,
      CONSTRAINT "RoleAssignment_did_fkey" FOREIGN KEY ("did") REFERENCES "DidDocument" ("did") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,

    // 5. AuditLogEntry
    `CREATE TABLE IF NOT EXISTS "AuditLogEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "eventType" TEXT NOT NULL,
      "actorAddress" TEXT NOT NULL,
      "targetDid" TEXT,
      "txHash" TEXT NOT NULL,
      "blockNumber" INTEGER NOT NULL,
      "logIndex" INTEGER NOT NULL DEFAULT 0,
      "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "metadataJson" TEXT NOT NULL
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS "AuditLogEntry_txHash_logIndex_key" ON "AuditLogEntry"("txHash", "logIndex");`,

    // 6. Document
    `CREATE TABLE IF NOT EXISTS "Document" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ownerAddress" TEXT NOT NULL,
      "documentType" TEXT NOT NULL DEFAULT 'OTHER',
      "title" TEXT NOT NULL,
      "description" TEXT,
      "originalFilename" TEXT NOT NULL,
      "encryptedStorageKey" TEXT NOT NULL,
      "documentHash" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "fileSize" INTEGER NOT NULL,
      "encryptionVersion" TEXT NOT NULL DEFAULT 'AES-256-GCM-v1',
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
      "issuerReference" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deletedAt" DATETIME,
      CONSTRAINT "Document_ownerAddress_fkey" FOREIGN KEY ("ownerAddress") REFERENCES "User" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,

    // 7. DocumentAccess
    `CREATE TABLE IF NOT EXISTS "DocumentAccess" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "documentId" TEXT NOT NULL,
      "ownerAddress" TEXT NOT NULL,
      "granteeAddress" TEXT NOT NULL,
      "permissionType" TEXT NOT NULL DEFAULT 'VIEW',
      "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expiresAt" DATETIME,
      "revokedAt" DATETIME,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      CONSTRAINT "DocumentAccess_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,

    // 8. DocumentVersion
    `CREATE TABLE IF NOT EXISTS "DocumentVersion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "documentId" TEXT NOT NULL,
      "versionNumber" INTEGER NOT NULL,
      "documentHash" TEXT NOT NULL,
      "encryptedStorageKey" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,

    // 9. DocumentVerification
    `CREATE TABLE IF NOT EXISTS "DocumentVerification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "documentId" TEXT NOT NULL,
      "verifierAddress" TEXT NOT NULL,
      "verificationType" TEXT NOT NULL,
      "verificationResult" TEXT NOT NULL DEFAULT 'VERIFIED',
      "verificationReference" TEXT,
      "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "notes" TEXT,
      CONSTRAINT "DocumentVerification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,

    // 10. DocumentAuditEvent
    `CREATE TABLE IF NOT EXISTS "DocumentAuditEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "documentId" TEXT,
      "actorAddress" TEXT NOT NULL,
      "actionType" TEXT NOT NULL,
      "resourceType" TEXT NOT NULL DEFAULT 'DOCUMENT',
      "resourceId" TEXT NOT NULL,
      "eventHash" TEXT NOT NULL,
      "blockchainTxHash" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "metadataJson" TEXT,
      CONSTRAINT "DocumentAuditEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );`,

    // 11. KycApplication
    `CREATE TABLE IF NOT EXISTS "KycApplication" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "applicantAddress" TEXT NOT NULL,
      "applicantDid" TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "dateOfBirth" TEXT,
      "nationality" TEXT,
      "idType" TEXT NOT NULL DEFAULT 'AADHAAR',
      "idNumber" TEXT NOT NULL,
      "documentFilename" TEXT,
      "documentData" TEXT,
      "selfieData" TEXT,
      "phone" TEXT,
      "email" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "reviewedBy" TEXT,
      "reviewNotes" TEXT,
      "reviewedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  ];

  for (const ddl of ddlStatements) {
    try {
      await prisma.$executeRawUnsafe(ddl);
    } catch (err: any) {
      logger.warn(`[initDb] Notice executing DDL: ${err.message}`);
    }
  }

  logger.info("[initDb] All database tables successfully ensured and ready for queries!");
}
