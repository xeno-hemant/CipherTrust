# CipherTrust Architecture Documentation

## System Overview
CipherTrust is an enterprise-grade, full-stack blockchain platform providing Decentralized Identity (DID), Role-Based Access Control (RBAC), Verifiable Digital Asset NFTs, and immutable audit logging.

```
                          ┌─────────────────────────┐
                          │   React Web Portal      │ (Port 3000)
                          └────────────┬────────────┘
                                       │ SIWE / REST SDK
                                       ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│   Admin Console         ├──►│    Node.js Backend      │◄──┤   Flutter Mobile App    │
│   (Port 3001)           │   │    (Express + Prisma)   │   │   (iOS/Android)         │
└─────────────────────────┘   └────────────┬────────────┘   └─────────────────────────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     │                     │                     │
                     ▼                     ▼                     ▼
            ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
            │ PostgreSQL DB   │   │ IPFS Gateway    │   │ Hardhat / Web3  │
            │ (Metadata Cache)│   │ (Pinata/Kubo)   │   │ Smart Contracts │
            └─────────────────┘   └─────────────────┘   └─────────────────┘
```

## Core Components
1. **Smart Contracts (`packages/contracts`)**
   - `CipherTrustRBAC.sol`: On-chain role permissions (`ADMIN_ROLE`, `ISSUER_ROLE`, `VERIFIER_ROLE`, `HOLDER_ROLE`).
   - `CipherTrustNFT.sol`: OpenZeppelin ERC721 metadata storage contract linked to recipient DIDs.
   - `CipherTrustAudit.sol`: Append-only event log with indexed events.

2. **Shared Packages (`packages/`)**
   - `shared-types`: Canonical domain DTOs and TypeScript interfaces.
   - `sdk`: Client library wrapping API calls for Web and Mobile frontends.

3. **Backend Service (`apps/backend`)**
   - SIWE authentication issuing signed JWT tokens.
   - Live Web3 event listener syncing on-chain state to PostgreSQL.
   - IPFS integration with automatic Pinata -> Local IPFS -> Deterministic Mock fallbacks.

4. **Applications (`apps/`)**
   - `web-portal`: End-user DID profile & verifiable asset inventory viewer.
   - `admin-console`: Admin metrics dashboard, NFT issuer form, RBAC role management, and audit log.
   - `mobile-wallet`: Cross-platform Flutter wallet app.
