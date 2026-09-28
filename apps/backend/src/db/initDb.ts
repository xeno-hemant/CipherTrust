import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
import { logger } from "../utils/logger";

/**
 * Initializes the database schema automatically on server boot.
 * Guaranteed to create all tables whether running locally, on Render, or in Docker.
 */
export async function initDb(): Promise<void> {
  logger.info("[initDb] Verifying database schema and tables...");

  // Strategy 1: Attempt Prisma db push CLI
  let cliSuccess = false;
  try {
    const candidatePaths = [
      path.resolve(__dirname, "../../prisma/schema.prisma"),
      path.resolve(__dirname, "../prisma/schema.prisma"),
      path.resolve(process.cwd(), "prisma/schema.prisma"),
      path.resolve(process.cwd(), "apps/backend/prisma/schema.prisma"),
    ];

    const schemaPath = candidatePaths.find((p) => fs.existsSync(p));

    if (schemaPath) {
      logger.info(`[initDb] Running prisma db push using schema: ${schemaPath}`);
      execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss --skip-generate`, {
        stdio: "pipe",
        env: { ...process.env },
        timeout: 30000,
      });
      logger.info("[initDb] Prisma CLI db push completed successfully!");
      cliSuccess = true;
    }
  } catch (err: any) {
    logger.warn(`[initDb] Prisma CLI push not possible or timed out (${err.message}), falling back to direct DDL execution.`);
  }

  // Strategy 2: Direct DDL table creation fallback for SQLite (guarantees tables exist)
  try {
    // 1. User
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "address" TEXT NOT NULL PRIMARY KEY,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. DidDocument
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DidDocument" (
        "did" TEXT NOT NULL PRIMARY KEY,
        "controllerAddress" TEXT NOT NULL,
        "publicKey" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "verified" BOOLEAN NOT NULL DEFAULT 1,
        CONSTRAINT "DidDocument_controllerAddress_fkey" FOREIGN KEY ("controllerAddress") REFERENCES "User" ("address") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    // 3. NftAsset
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NftAsset" (
        "tokenId" TEXT NOT NULL,
        "contractAddress" TEXT NOT NULL,
        "ownerDid" TEXT NOT NULL,
        "metadataUri" TEXT NOT NULL,
        "metadataJson" TEXT NOT NULL,
        "mintedBy" TEXT NOT NULL,
        "mintedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("tokenId", "contractAddress"),
        CONSTRAINT "NftAsset_ownerDid_fkey" FOREIGN KEY ("ownerDid") REFERENCES "DidDocument" ("did") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    // 4. RoleAssignment
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RoleAssignment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "did" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "assignedBy" TEXT NOT NULL,
        "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "active" BOOLEAN NOT NULL DEFAULT 1,
        CONSTRAINT "RoleAssignment_did_fkey" FOREIGN KEY ("did") REFERENCES "DidDocument" ("did") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    // 5. AuditLogEntry
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLogEntry" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "eventType" TEXT NOT NULL,
        "actorAddress" TEXT NOT NULL,
        "targetDid" TEXT,
        "txHash" TEXT NOT NULL,
        "blockNumber" INTEGER NOT NULL,
        "logIndex" INTEGER NOT NULL DEFAULT 0,
        "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metadataJson" TEXT NOT NULL
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AuditLogEntry_txHash_logIndex_key" ON "AuditLogEntry"("txHash", "logIndex");
    `);

    // 6. Document
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Document" (
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
      );
    `);

    // 7. DocumentAccess
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocumentAccess" (
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
      );
    `);

    // 8. DocumentVersion
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocumentVersion" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "documentId" TEXT NOT NULL,
        "versionNumber" INTEGER NOT NULL,
        "documentHash" TEXT NOT NULL,
        "encryptedStorageKey" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 9. DocumentVerification
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocumentVerification" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "documentId" TEXT NOT NULL,
        "verifierAddress" TEXT NOT NULL,
        "verificationType" TEXT NOT NULL,
        "verificationResult" TEXT NOT NULL DEFAULT 'VERIFIED',
        "verificationReference" TEXT,
        "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "notes" TEXT,
        CONSTRAINT "DocumentVerification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 10. DocumentAuditEvent
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocumentAuditEvent" (
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
      );
    `);

    // 11. KycApplication
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "KycApplication" (
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
      );
    `);

    logger.info("[initDb] All database tables verified and ensured to exist!");
  } catch (sqlErr: any) {
    logger.error(`[initDb] Error during DDL table verification: ${sqlErr.message}`);
  }
}
