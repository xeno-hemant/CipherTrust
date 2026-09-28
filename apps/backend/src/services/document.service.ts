import crypto from "crypto";
import { prisma } from "../db/prisma";
import { CryptoService } from "./crypto.service";
import { StorageService } from "./storage.service";
import { AuditService } from "./audit.service";
import { logger } from "../utils/logger";
import {
  DocumentType,
  DocumentStatus,
  VerificationStatus,
  PermissionType,
  Role,
} from "@ciphertrust/shared-types";

export interface UploadDocumentParams {
  ownerAddress: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  originalFilename: string;
  mimeType: string;
  fileBuffer: Buffer;
}

export class DocumentService {
  /**
   * Allowed MIME types for uploaded documents.
   */
  private static ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  /**
   * Maximum file size in bytes (15 MB).
   */
  private static MAX_FILE_SIZE = 15 * 1024 * 1024;

  /**
   * Helper to ensure User record exists in Postgres before attaching relations.
   */
  private static async ensureUserExists(address: string) {
    const normalized = address.toLowerCase();
    await prisma.user.upsert({
      where: { address: normalized },
      create: { address: normalized },
      update: {},
    });
    return normalized;
  }

  /**
   * Upload, encrypt, hash, and store a document.
   */
  public static async uploadDocument(params: UploadDocumentParams) {
    const { ownerAddress, documentType, title, description, originalFilename, mimeType, fileBuffer } = params;
    const normalizedOwner = await this.ensureUserExists(ownerAddress);

    // 1. File Type & Size Validation
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new Error(`Invalid file type '${mimeType}'. Supported types: PDF, JPG, JPEG, PNG.`);
    }
    if (fileBuffer.length > this.MAX_FILE_SIZE) {
      throw new Error(`File size (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds 15 MB limit.`);
    }

    // 2. Generate SHA-256 Hash of raw file content
    const documentHash = CryptoService.hashBuffer(fileBuffer);
    const documentId = crypto.randomUUID();

    // 3. Encrypt file buffer using AES-256-GCM
    const encryptedBuffer = CryptoService.encryptBuffer(fileBuffer, documentId);

    // 4. Save encrypted binary file to off-chain storage
    const storageKey = await StorageService.saveEncryptedFile(documentId, encryptedBuffer);

    // 5. Store Metadata in Postgres via Prisma
    const doc = await prisma.document.create({
      data: {
        id: documentId,
        ownerAddress: normalizedOwner,
        documentType: documentType || DocumentType.OTHER,
        title: title || originalFilename,
        description,
        originalFilename,
        encryptedStorageKey: storageKey,
        documentHash,
        mimeType,
        fileSize: fileBuffer.length,
        encryptionVersion: "AES-256-GCM-v1",
        status: DocumentStatus.ACTIVE,
        verificationStatus: VerificationStatus.UNVERIFIED,
      },
    });

    // 6. Create Version 1 record
    await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: 1,
        documentHash,
        encryptedStorageKey: storageKey,
      },
    });

    // 7. Record Document Audit Event
    const eventHash = crypto.createHash("sha256").update(`${documentId}:UPLOAD:${Date.now()}`).digest("hex");
    await prisma.documentAuditEvent.create({
      data: {
        documentId,
        actorAddress: normalizedOwner,
        actionType: "UPLOAD",
        resourceType: "DOCUMENT",
        resourceId: documentId,
        eventHash,
        metadataJson: JSON.stringify({
          title,
          documentType,
          originalFilename,
          fileSize: fileBuffer.length,
          documentHash,
        }),
      },
    });

    // 8. Optionally log to on-chain Audit logger if available
    try {
      await AuditService.logOnChainAudit(
        "DID_CREATED",
        normalizedOwner,
        `did:ethr:${normalizedOwner}`,
        { action: "DOCUMENT_UPLOADED", documentId, documentHash }
      ).catch(() => {});
    } catch (e) {
      // Ignore on-chain log error fallback
    }

    logger.info(`[DocumentService] Successfully created document ${documentId} for owner ${normalizedOwner}`);
    return doc;
  }

  /**
   * Get all active documents owned by user.
   */
  public static async getMyDocuments(ownerAddress: string) {
    const normalizedOwner = ownerAddress.toLowerCase();
    return prisma.document.findMany({
      where: {
        ownerAddress: normalizedOwner,
        status: { not: DocumentStatus.DELETED },
      },
      include: {
        accessList: true,
        verifications: true,
        versions: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get documents shared with user.
   */
  public static async getSharedDocuments(userAddress: string) {
    const normalizedUser = userAddress.toLowerCase();
    const activeAccessEntries = await prisma.documentAccess.findMany({
      where: {
        granteeAddress: normalizedUser,
        status: "ACTIVE",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        document: {
          include: {
            verifications: true,
          },
        },
      },
      orderBy: { grantedAt: "desc" },
    });

    return activeAccessEntries
      .filter((access) => access.document && access.document.status !== DocumentStatus.DELETED)
      .map((access) => ({
        ...access.document,
        permissionType: access.permissionType,
        grantedAt: access.grantedAt,
        expiresAt: access.expiresAt,
        accessId: access.id,
      }));
  }

  /**
   * Get full details of a specific document with authorization check.
   */
  public static async getDocumentDetails(documentId: string, requestingAddress: string) {
    const normalized = requestingAddress.toLowerCase();
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        accessList: true,
        verifications: true,
        versions: true,
        auditEvents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!doc || doc.status === DocumentStatus.DELETED) {
      throw new Error("Document not found");
    }

    // Check authorization: Owner, Grantee, or Admin
    const isOwner = doc.ownerAddress.toLowerCase() === normalized;
    const activeAccess = doc.accessList.find(
      (a) =>
        a.granteeAddress.toLowerCase() === normalized &&
        a.status === "ACTIVE" &&
        (!a.expiresAt || new Date(a.expiresAt) > new Date())
    );

    if (!isOwner && !activeAccess) {
      throw new Error("Unauthorized access to document metadata");
    }

    return {
      ...doc,
      isOwner,
      userPermission: isOwner ? "OWNER" : activeAccess?.permissionType,
    };
  }

  /**
   * Decrypt and stream file content for authorized user.
   */
  public static async downloadDocument(documentId: string, requestingAddress: string) {
    const normalized = requestingAddress.toLowerCase();
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { accessList: true },
    });

    if (!doc || doc.status === DocumentStatus.DELETED) {
      throw new Error("Document not found");
    }

    // Check authorization: Owner or Grantee with VIEW or DOWNLOAD permission
    const isOwner = doc.ownerAddress.toLowerCase() === normalized;
    const access = doc.accessList.find(
      (a) =>
        a.granteeAddress.toLowerCase() === normalized &&
        a.status === "ACTIVE" &&
        (!a.expiresAt || new Date(a.expiresAt) > new Date()) &&
        (a.permissionType === PermissionType.DOWNLOAD || a.permissionType === PermissionType.VIEW)
    );

    if (!isOwner && !access) {
      throw new Error("Unauthorized: You do not have permission to download or view this document.");
    }

    // Read encrypted binary file from off-chain storage
    const encryptedBuffer = await StorageService.readEncryptedFile(doc.encryptedStorageKey);

    // Decrypt buffer using AES-256-GCM
    const decryptedBuffer = CryptoService.decryptBuffer(encryptedBuffer, documentId);

    // Record Audit Event
    const eventHash = crypto.createHash("sha256").update(`${documentId}:DOWNLOAD:${Date.now()}`).digest("hex");
    await prisma.documentAuditEvent.create({
      data: {
        documentId,
        actorAddress: normalized,
        actionType: "DOWNLOAD",
        resourceType: "DOCUMENT",
        resourceId: documentId,
        eventHash,
        metadataJson: JSON.stringify({
          requestedBy: normalized,
          filename: doc.originalFilename,
          mimeType: doc.mimeType,
        }),
      },
    });

    return {
      buffer: decryptedBuffer,
      mimeType: doc.mimeType,
      filename: doc.originalFilename,
    };
  }

  /**
   * Share document with recipient address.
   */
  public static async shareDocument(
    documentId: string,
    ownerAddress: string,
    granteeAddress: string,
    permissionType: PermissionType = PermissionType.VIEW,
    expiresAt?: Date
  ) {
    const normalizedOwner = ownerAddress.toLowerCase();
    const normalizedGrantee = granteeAddress.toLowerCase();

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.ownerAddress.toLowerCase() !== normalizedOwner) {
      throw new Error("Unauthorized: Only document owner can share access.");
    }

    // Upsert DocumentAccess entry
    const access = await prisma.documentAccess.create({
      data: {
        documentId,
        ownerAddress: normalizedOwner,
        granteeAddress: normalizedGrantee,
        permissionType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "ACTIVE",
      },
    });

    // Audit trail
    const eventHash = crypto.createHash("sha256").update(`${documentId}:SHARE:${Date.now()}`).digest("hex");
    await prisma.documentAuditEvent.create({
      data: {
        documentId,
        actorAddress: normalizedOwner,
        actionType: "SHARE",
        resourceType: "DOCUMENT",
        resourceId: documentId,
        eventHash,
        metadataJson: JSON.stringify({
          granteeAddress: normalizedGrantee,
          permissionType,
          expiresAt: expiresAt?.toISOString(),
        }),
      },
    });

    logger.info(`[DocumentService] Owner ${normalizedOwner} shared doc ${documentId} with ${normalizedGrantee}`);
    return access;
  }

  /**
   * Revoke sharing access for a recipient.
   */
  public static async revokeAccess(documentId: string, ownerAddress: string, accessId: string) {
    const normalizedOwner = ownerAddress.toLowerCase();

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.ownerAddress.toLowerCase() !== normalizedOwner) {
      throw new Error("Unauthorized: Only document owner can revoke access.");
    }

    const updated = await prisma.documentAccess.update({
      where: { id: accessId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    // Audit trail
    const eventHash = crypto.createHash("sha256").update(`${documentId}:REVOKE:${Date.now()}`).digest("hex");
    await prisma.documentAuditEvent.create({
      data: {
        documentId,
        actorAddress: normalizedOwner,
        actionType: "REVOKE",
        resourceType: "DOCUMENT",
        resourceId: documentId,
        eventHash,
        metadataJson: JSON.stringify({
          accessId,
          granteeAddress: updated.granteeAddress,
        }),
      },
    });

    logger.info(`[DocumentService] Revoked access ${accessId} for document ${documentId}`);
    return updated;
  }

  /**
   * Verify file cryptographic integrity by recalculating SHA-256 hash.
   */
  public static async verifyIntegrity(documentId: string) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new Error("Document not found");
    }

    const encryptedBuffer = await StorageService.readEncryptedFile(doc.encryptedStorageKey);
    const decryptedBuffer = CryptoService.decryptBuffer(encryptedBuffer, documentId);
    const currentHash = CryptoService.hashBuffer(decryptedBuffer);

    const match = currentHash.toLowerCase() === doc.documentHash.toLowerCase();

    return {
      documentId: doc.id,
      title: doc.title,
      storedHash: doc.documentHash,
      calculatedHash: currentHash,
      match,
      verificationStatus: doc.verificationStatus,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Update issuer verification status for a document.
   */
  public static async verifyIssuerStatus(
    documentId: string,
    verifierAddress: string,
    verificationResult: VerificationStatus,
    verificationReference?: string,
    notes?: string
  ) {
    const normalizedVerifier = verifierAddress.toLowerCase();

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new Error("Document not found");
    }

    // Create Verification Record
    const verification = await prisma.documentVerification.create({
      data: {
        documentId,
        verifierAddress: normalizedVerifier,
        verificationType: "ISSUER_ATTESTATION",
        verificationResult,
        verificationReference: verificationReference || `ATT-${Date.now()}`,
        notes,
      },
    });

    // Update document status
    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: {
        verificationStatus: verificationResult,
        issuerReference: verificationReference || doc.issuerReference,
      },
    });

    // Record Audit
    const eventHash = crypto.createHash("sha256").update(`${documentId}:VERIFY:${Date.now()}`).digest("hex");
    await prisma.documentAuditEvent.create({
      data: {
        documentId,
        actorAddress: normalizedVerifier,
        actionType: "VERIFY",
        resourceType: "DOCUMENT",
        resourceId: documentId,
        eventHash,
        metadataJson: JSON.stringify({
          verificationResult,
          verificationReference,
          notes,
        }),
      },
    });

    return {
      document: updatedDoc,
      verification,
    };
  }

  /**
   * Get full audit history for a document.
   */
  public static async getDocumentAuditHistory(documentId: string, requestingAddress: string) {
    const details = await this.getDocumentDetails(documentId, requestingAddress);
    return details.auditEvents;
  }

  /**
   * Soft delete document.
   */
  public static async deleteDocument(documentId: string, ownerAddress: string) {
    const normalizedOwner = ownerAddress.toLowerCase();
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.ownerAddress.toLowerCase() !== normalizedOwner) {
      throw new Error("Unauthorized: Only document owner can delete this document.");
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    // Clean up physical encrypted file
    await StorageService.deleteEncryptedFile(doc.encryptedStorageKey);

    // Audit Event
    const eventHash = crypto.createHash("sha256").update(`${documentId}:DELETE:${Date.now()}`).digest("hex");
    await prisma.documentAuditEvent.create({
      data: {
        documentId,
        actorAddress: normalizedOwner,
        actionType: "DELETE",
        resourceType: "DOCUMENT",
        resourceId: documentId,
        eventHash,
      },
    });

    return updated;
  }
}
