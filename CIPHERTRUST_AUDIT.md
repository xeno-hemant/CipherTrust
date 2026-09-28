# CipherTrust — Complete Codebase Audit & System Specification

**Date:** September 17, 2026  
**Status:** Audit Complete  
**Target:** CipherTrust Blockchain Identity, Access Control & Secure Document Management Platform  

---

## 1. Existing Architecture & Tech Stack

### 1.1 Architecture Diagram
```
                     CIPHERTRUST PLATFORM
                               |
                               v
                     EXISTING FRONTENDS
          +--------------------+--------------------+
          |                    |                    |
          v                    v                    v
     Web Portal          Admin Console        Mobile Wallet
    (React + Vite)      (React + Vite)          (Flutter)
          |                    |                    |
          +--------------------+--------------------+
                               |
                               v
                   BACKEND API LAYER (Port 4005)
                   Express.js + TypeScript + SIWE
                               |
          +--------------------+--------------------+
          |                    |                    |
          v                    v                    v
    Identity Service     Asset/NFT Service    Role & Audit Service
   (W3C DID Generator)  (Ethers v6 + IPFS)    (Prisma + Listener)
          |                    |                    |
          +--------------------+--------------------+
                               |
          +--------------------+--------------------+
          |                                         |
          v                                         v
   PostgreSQL DB                             Smart Contracts
(Users, DIDs, NFTs, Roles)               (RBAC, NFT ERC721, Audit)
                                                    |
                                                    v
                                            Blockchain RPC
                                           (Hardhat / Polygon)
```

### 1.2 Tech Stack Overview
- **Monorepo Management:** Pnpm workspaces (`apps/*`, `packages/*`) + Turborepo.
- **Backend API (`apps/backend`):** Node.js Express server with TypeScript, SIWE (Sign-In With Ethereum), Ethers.js v6, Prisma ORM, CORS, JSON Web Tokens (JWT).
- **Smart Contracts (`packages/contracts`):** Hardhat environment, Solidity 0.8.24, OpenZeppelin 5.x contracts (`CipherTrustRBAC`, `CipherTrustNFT`, `CipherTrustAudit`).
- **Shared Packages:**
  - `packages/shared-types`: Canonical TypeScript interfaces (`DIDDocument`, `NFTAsset`, `RoleAssignment`, `AuditLogEntry`, `AuthSession`, `Role`).
  - `packages/sdk`: Reusable `CipherTrustClient` SDK wrapper for API consumption.
- **Frontend Applications:**
  - `apps/web-portal`: React 18 + Vite + Tailwind CSS (User portal & integrated admin portal).
  - `apps/admin-console`: React 18 + Vite + Tailwind CSS (Standalone admin dashboard).
  - `apps/mobile-wallet`: Flutter mobile app shell.

---

## 2. Comprehensive Audit Findings

### 2.1 Existing Features (Fully Working & Verified)
- **SIWE Authentication:** Nonce request (`/auth/nonce`) and EIP-4361 signature verification (`/auth/verify`) issuing 24-hour signed JWTs.
- **DID Management:** Deterministic W3C DID document creation (`did:ethr:<chainId>:<address>`) with database persistence and optional on-chain anchoring.
- **RBAC Smart Contract & Role Sync:** On-chain `CipherTrustRBAC.sol` role management with `ADMIN`, `ISSUER`, `VERIFIER`, `HOLDER` roles, plus event listeners syncing to Postgres.
- **NFT Minting & Ownership Tracking:** `CipherTrustNFT.sol` ERC721 minting linked to owner DID and pinned IPFS metadata.
- **Append-Only On-Chain Audit Logging:** `CipherTrustAudit.sol` logging system with event listeners populating Postgres audit tables (`AuditLogEntry`).
- **Web Portal & Admin UI:** Responsive tabs for DID status, NFT inventory, issuing assets, managing roles, and live 5-second polling audit explorer.

### 2.2 Partially Implemented Features
- **IPFS Pinning:** IPFS service supports live Pinata IPFS pinning when `PINATA_JWT` is provided, but defaults to SHA-256 deterministic mock CID when `MOCK_MODE=true`.
- **DID Resolution:** Basic static W3C JSON representation without verifiable credential attachment support.

### 2.3 Visual Mockups / Stubs
- None. All current frontend components connect to active SDK methods and backend endpoints.

### 2.4 Missing Functionality (Target Capabilities)
1. **Secure Off-Chain Document Storage:** No system currently exists for uploading, encrypting, and downloading off-chain files (Aadhaar, degree certificates, marksheets, etc.).
2. **Client/Server AES-256-GCM Encryption:** No key derivation or document payload encryption/decryption before saving to off-chain storage.
3. **Document Database Schema:** Database lacks models for `Document`, `DocumentAccess`, `DocumentVersion`, `DocumentVerification`, and off-chain `AuditEvent`.
4. **Document Integrity Verification:** Cryptographic SHA-256 hash calculation and verification against stored documents.
5. **Issuer Document Verification Workflow:** Workflow for marking documents as `UNVERIFIED` on upload and allowing `ISSUER`/`VERIFIER` roles to formally attest document validity.
6. **Time-Bound Sharing & Access Revocation:** Granular document permission sharing (`VIEW`, `DOWNLOAD`, `VERIFY`) with expiration dates and explicit revocation capabilities.
7. **Document Management Frontend UI:** Web portal tabs for document upload, listing, preview, downloading, sharing, permission management, and audit inspection.
8. **SDK Methods for Documents:** Client SDK methods for document CRUD, sharing, downloading, and verification.

### 2.5 Security Concerns & Vulnerabilities
- **Exposed Credentials / Keys:** Default fallback keys in `.env.example` / `env.ts` must never be used in production.
- **Unencrypted Off-Chain Data:** Sensitive identity documents must never be stored as raw files on IPFS or public object storage.
- **IDOR / Unauthorized Access Risks:** API endpoints for downloading or reading documents must strictly validate JWT sessions and document permissions (`owner_user_id` or active `DocumentAccess` entry).
- **Public URL Exposure:** Document storage keys must not be exposed as permanent public URLs. Downloads must use authenticated streaming or short-lived signed URLs.

### 2.6 Technical Limitations
- **Database Dependency:** Monorepo requires PostgreSQL (port 5433 / 5432) with Prisma for JSON and UUID fields.
- **Smart Contract Backward Compatibility:** Existing deployed contracts (`CipherTrustRBAC`, `CipherTrustNFT`, `CipherTrustAudit`) must remain untouched; document functionality will anchor integrity hashes to `CipherTrustAudit` or record off-chain audit logs.

---

## 3. Recommended Integration Points

1. **Database Schema (`apps/backend/prisma/schema.prisma`):**
   - Add `DocumentType`, `DocumentStatus`, `VerificationStatus`, `PermissionType` enums.
   - Add models: `Document`, `DocumentAccess`, `DocumentVersion`, `DocumentVerification`, `DocumentAuditEvent`.
   - Update `User` model to relate with `Document`.

2. **Backend Document Module (`apps/backend/src`):**
   - Storage Adapter (`services/storage.service.ts`): Secure encrypted local disk storage adapter (or Supabase/S3 compatible) operating within `apps/backend/storage/encrypted/`.
   - Encryption Service (`services/crypto.service.ts`): Key management and AES-256-GCM envelope encryption.
   - Document Service (`services/document.service.ts`): Upload, SHA-256 hashing, encryption, database persistence, sharing, revocation, download streaming, verification, version tracking, and audit logging.
   - Document Controller & Routes (`routes/document.routes.ts`): Express endpoints under `/api/documents/*`.

3. **Shared Types (`packages/shared-types`):**
   - Define interfaces: `DocumentRecord`, `DocumentAccessRecord`, `DocumentVersionRecord`, `DocumentVerificationRecord`, `DocumentUploadRequest`, `ShareDocumentRequest`, `RevokeAccessRequest`, `VerifyDocumentRequest`.

4. **SDK Methods (`packages/sdk`):**
   - Add document management methods to `CipherTrustClient`: `uploadDocument`, `listMyDocuments`, `getSharedDocuments`, `getDocumentDetails`, `downloadDocument`, `shareDocument`, `revokeAccess`, `verifyDocumentIntegrity`, `verifyDocumentIssuer`, `getDocumentAuditLogs`.

5. **Frontend Integration (`apps/web-portal`):**
   - Add "My Documents" navigation tab to `Header.tsx` and `App.tsx`.
   - Create components: `DocumentManagementPage.tsx`, `UploadDocumentModal.tsx`, `DocumentDetailModal.tsx`, `ShareDocumentModal.tsx`, `DocumentVerificationBadge.tsx`.

---

## 4. Potential Breaking Changes & Safeguards

| Potential Risk | Prevention / Safeguard Strategy |
| :--- | :--- |
| **Breaking existing NFT minting flow** | Keep NFT routes, contracts, and IPFS metadata pinning intact. Documents will have their own dedicated endpoints (`/api/documents`). |
| **Breaking existing UI layout** | Extend navigation with a new tab ("My Documents") without modifying existing tabs ("DID Identity", "Asset Inventory"). |
| **Database Migration Data Loss** | Use additive Prisma migrations (`prisma migrate dev` or `prisma db push`) that preserve existing `User`, `DidDocument`, `NftAsset`, `RoleAssignment`, and `AuditLogEntry` tables. |
| **Exposing sensitive document on blockchain** | Only SHA-256 hashes and non-sensitive audit event identifiers will be anchored to `CipherTrustAudit.sol`. Raw files, names, or Aadhaar numbers will never touch the blockchain. |

---

## 5. Phased Implementation Plan

- **Phase 1:** Audit Codebase & Create Documentation (`CIPHERTRUST_AUDIT.md`).
- **Phase 2:** Extend `packages/shared-types` and Prisma Schema with Document Models.
- **Phase 3:** Implement Server-Side AES-256-GCM Crypto & Encrypted File Storage Service.
- **Phase 4:** Implement Document Service, Verification Logic, and Express API Routes.
- **Phase 5:** Update `CipherTrustClient` SDK with Document Management methods.
- **Phase 6:** Integrate Document Management UI into Web Portal (`apps/web-portal`).
- **Phase 7:** Execute Comprehensive End-to-End Verification (File upload, encryption, permission check, sharing, revocation, verification, audit logging).
- **Phase 8:** Generate Final Documentation & Architecture Summaries.
