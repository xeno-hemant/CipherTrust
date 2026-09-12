# CipherTrust API Reference

All backend API endpoints are exposed under `/api` (Default base URL: `http://localhost:4005/api`).

## Authentication (SIWE)
### `POST /api/auth/nonce`
Generate authentication nonce for wallet address.
- **Request Body**: `{ "address": "0x..." }`
- **Response**: `{ "nonce": "..." }`

### `POST /api/auth/verify`
Verify SIWE message signature and receive AuthSession JWT.
- **Request Body**: `{ "message": "...", "signature": "0x..." }`
- **Response**: `{ "token": "JWT_STRING", "session": { "address": "...", "did": "...", "roles": ["ADMIN"] } }`

---

## Identity (DID)
### `POST /api/did/create` (Auth Required)
Derive and register W3C DID document.
- **Request Body**: `{ "address": "0x..." }`
- **Response**: `DIDDocument`

### `GET /api/did/:addressOrDid`
Resolve DID document details.
- **Response**: `DIDDocument`

---

## Verifiable Assets (NFT)
### `POST /api/nft/mint` (Auth & ISSUER Role Required)
Mint verifiable digital asset.
- **Request Body**:
  ```json
  {
    "recipientAddress": "0x...",
    "name": "Identity Access Pass",
    "description": "Level 4 Clearance Credential",
    "image": "https://...",
    "attributes": [{ "trait_type": "Clearance", "value": "Level 4" }]
  }
  ```
- **Response**: `NFTAsset`

### `GET /api/nft/inventory/:didOrAddress`
Fetch digital assets owned by specified DID.
- **Response**: `NFTAsset[]`

---

## Role-Based Access Control (RBAC)
### `POST /api/roles/assign` (Auth & ADMIN Role Required)
Assign on-chain RBAC role.
- **Request Body**: `{ "did": "did:ethr:31337:0x...", "role": "ISSUER" }`
- **Response**: `RoleAssignment`

### `POST /api/roles/revoke` (Auth & ADMIN Role Required)
Revoke on-chain RBAC role.
- **Request Body**: `{ "did": "did:ethr:31337:0x...", "role": "ISSUER" }`
- **Response**: `{ "success": true, "message": "..." }`

---

## Audit Logs
### `GET /api/audit`
Retrieve paginated audit trail.
- **Query Params**: `eventType`, `actor`, `targetDid`, `page`, `limit`
- **Response**: `PaginatedResponse<AuditLogEntry>`

---

## System Statistics
### `GET /api/stats`
Retrieve high-level dashboard aggregate metrics.
- **Response**: `SystemStats`
