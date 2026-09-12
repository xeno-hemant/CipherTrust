-- CipherTrust Database Initial DDL Schema for PostgreSQL

CREATE TYPE "Role" AS ENUM ('ADMIN', 'ISSUER', 'VERIFIER', 'HOLDER');

CREATE TABLE IF NOT EXISTS "User" (
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("address")
);

CREATE TABLE IF NOT EXISTS "DidDocument" (
    "did" TEXT NOT NULL,
    "controllerAddress" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "DidDocument_pkey" PRIMARY KEY ("did"),
    CONSTRAINT "DidDocument_controllerAddress_fkey" FOREIGN KEY ("controllerAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "NftAsset" (
    "tokenId" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "ownerDid" TEXT NOT NULL,
    "metadataUri" TEXT NOT NULL,
    "metadataJson" JSONB NOT NULL,
    "mintedBy" TEXT NOT NULL,
    "mintedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NftAsset_pkey" PRIMARY KEY ("tokenId","contractAddress"),
    CONSTRAINT "NftAsset_ownerDid_fkey" FOREIGN KEY ("ownerDid") REFERENCES "DidDocument"("did") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RoleAssignment" (
    "id" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RoleAssignment_did_fkey" FOREIGN KEY ("did") REFERENCES "DidDocument"("did") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorAddress" TEXT NOT NULL,
    "targetDid" TEXT,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" JSONB NOT NULL,
    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuditLogEntry_txHash_logIndex_key" ON "AuditLogEntry"("txHash", "logIndex");
