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
  eventType: "DID_CREATED" | "NFT_MINTED" | "ROLE_ASSIGNED" | "ROLE_REVOKED" | "OWNERSHIP_TRANSFERRED" | "KYC_SUBMITTED" | "KYC_VERIFIED" | "KYC_REJECTED" | string;
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
  totalDocuments?: number;
  verifiedDocumentsCount?: number;
}

// Document Enums & Types
export enum DocumentType {
  AADHAAR = "AADHAAR",
  MARKSHEET = "MARKSHEET",
  DEGREE_CERTIFICATE = "DEGREE_CERTIFICATE",
  GOVT_CERTIFICATE = "GOVT_CERTIFICATE",
  PROFESSIONAL_CERTIFICATE = "PROFESSIONAL_CERTIFICATE",
  OTHER = "OTHER"
}

export enum DocumentStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED"
}

export enum VerificationStatus {
  UNVERIFIED = "UNVERIFIED",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED"
}

export enum PermissionType {
  VIEW = "VIEW",
  DOWNLOAD = "DOWNLOAD",
  VERIFY = "VERIFY"
}

export interface DocumentRecord {
  id: string;
  ownerAddress: string;
  ownerDid?: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  originalFilename: string;
  encryptedStorageKey: string;
  documentHash: string;
  mimeType: string;
  fileSize: number;
  encryptionVersion: string;
  status: DocumentStatus;
  verificationStatus: VerificationStatus;
  issuerReference?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  accessCount?: number;
  accessList?: DocumentAccessRecord[];
  verifications?: DocumentVerificationRecord[];
}

export interface DocumentAccessRecord {
  id: string;
  documentId: string;
  ownerAddress: string;
  granteeAddress: string;
  granteeDid?: string;
  permissionType: PermissionType;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
}

export interface DocumentVersionRecord {
  id: string;
  documentId: string;
  versionNumber: number;
  documentHash: string;
  encryptedStorageKey: string;
  createdAt: string;
}

export interface DocumentVerificationRecord {
  id: string;
  documentId: string;
  verifierAddress: string;
  verifierDid?: string;
  verificationType: string;
  verificationResult: VerificationStatus;
  verificationReference?: string;
  verifiedAt: string;
  notes?: string;
}

export interface DocumentAuditEventRecord {
  id: string;
  actorAddress: string;
  actionType: "UPLOAD" | "VIEW" | "DOWNLOAD" | "SHARE" | "REVOKE" | "VERIFY" | "DELETE";
  resourceType: "DOCUMENT";
  resourceId: string;
  eventHash: string;
  blockchainTxHash?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ShareDocumentRequest {
  granteeAddress: string;
  permissionType: PermissionType;
  expiresAt?: string;
}

export interface VerifyIssuerRequest {
  verificationResult: VerificationStatus;
  verificationReference?: string;
  notes?: string;
}

// KYC Enums & Types
export enum KycStatus {
  NOT_SUBMITTED = "NOT_SUBMITTED",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export interface KycRecord {
  id: string;
  applicantAddress: string;
  applicantDid: string;
  fullName: string;
  dateOfBirth?: string | null;
  nationality?: string | null;
  idType: string;
  idNumber: string;
  documentFilename?: string | null;
  documentData?: string | null;
  selfieData?: string | null;
  phone?: string | null;
  email?: string | null;
  status: KycStatus;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitKycRequest {
  fullName: string;
  dateOfBirth?: string;
  nationality?: string;
  idType: string;
  idNumber: string;
  documentFilename?: string;
  documentData?: string;
  selfieData?: string;
  phone?: string;
  email?: string;
}

export interface ReviewKycRequest {
  status: KycStatus.APPROVED | KycStatus.REJECTED;
  reviewNotes?: string;
}


