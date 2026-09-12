// packages/shared-types/src/index.ts

export enum Role {
  ADMIN = "ADMIN",
  ISSUER = "ISSUER",
  VERIFIER = "VERIFIER",
  HOLDER = "HOLDER"
}

export interface DIDDocument {
  did: string;                 // did:ethr:<chainId>:<address>
  controllerAddress: string;
  publicKey: string;
  createdAt: string;           // ISO timestamp
  verified: boolean;
}

export interface NFTAsset {
  tokenId: string;
  contractAddress: string;
  ownerDid: string;
  metadataUri: string;         // ipfs://<CID>
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Record<string, string | number>[];
  };
  mintedBy: string;             // address of issuer
  mintedAt: string;
}

export interface RoleAssignment {
  did: string;
  role: Role;
  assignedBy: string;
  assignedAt: string;
  active: boolean;
}

export interface AuditLogEntry {
  id: string;
  eventType: "DID_CREATED" | "NFT_MINTED" | "ROLE_ASSIGNED" | "ROLE_REVOKED" | "OWNERSHIP_TRANSFERRED";
  actorAddress: string;
  targetDid?: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface SiweAuthPayload {
  message: string;
  signature: string;
}

export interface AuthSession {
  address: string;
  did: string;
  roles: Role[];
  issuedAt: string;
  expiresAt: string;
}

export interface NonceResponse {
  nonce: string;
}

export interface AuthResponse {
  token: string;
  session: AuthSession;
}

export interface CreateDidRequest {
  address: string;
}

export interface MintNftRequest {
  recipientAddress: string;
  name: string;
  description: string;
  image: string;
  attributes: Record<string, string | number>[];
}

export interface TransferNftRequest {
  tokenId: string;
  contractAddress: string;
  recipientAddress: string;
}

export interface AssignRoleRequest {
  did: string;
  role: Role;
}

export interface RevokeRoleRequest {
  did: string;
  role: Role;
}

export interface AuditQueryFilter {
  eventType?: string;
  actor?: string;
  targetDid?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SystemStats {
  totalDids: number;
  totalNfts: number;
  activeRolesCount: number;
  auditEventsLast24h: number;
}
