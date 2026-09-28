import { Router, Response } from "express";
import multer from "multer";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { DocumentService } from "../services/document.service";
import { logger } from "../utils/logger";
import { DocumentType, PermissionType, VerificationStatus } from "@ciphertrust/shared-types";

const router = Router();
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

/**
 * POST /api/documents/upload
 * Upload and encrypt a document.
 */
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userAddress = req.session?.address;
      if (!userAddress) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided for upload" });
      }

      const { documentType, title, description } = req.body;

      const document = await DocumentService.uploadDocument({
        ownerAddress: userAddress,
        documentType: (documentType as DocumentType) || DocumentType.OTHER,
        title: title || file.originalname,
        description,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileBuffer: file.buffer,
      });

      return res.status(201).json(document);
    } catch (err: any) {
      logger.error("[Document Route] Upload error:", err.message || err);
      return res.status(400).json({ error: err.message || "Document upload failed" });
    }
  }
);

/**
 * GET /api/documents/my
 * Get all documents owned by current authenticated user.
 */
router.get("/my", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.session?.address;
    if (!userAddress) return res.status(401).json({ error: "Unauthorized" });

    const documents = await DocumentService.getMyDocuments(userAddress);
    return res.json(documents);
  } catch (err: any) {
    logger.error("[Document Route] Get my documents error:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve documents" });
  }
});

/**
 * GET /api/documents/shared
 * Get all documents shared with current authenticated user.
 */
router.get("/shared", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.session?.address;
    if (!userAddress) return res.status(401).json({ error: "Unauthorized" });

    const sharedDocs = await DocumentService.getSharedDocuments(userAddress);
    return res.json(sharedDocs);
  } catch (err: any) {
    logger.error("[Document Route] Get shared documents error:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve shared documents" });
  }
});

/**
 * GET /api/documents/:id
 * Get details of a single document.
 */
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.session?.address;
    if (!userAddress) return res.status(401).json({ error: "Unauthorized" });

    const docDetails = await DocumentService.getDocumentDetails(req.params.id, userAddress);
    return res.json(docDetails);
  } catch (err: any) {
    logger.error("[Document Route] Get details error:", err);
    return res.status(404).json({ error: err.message || "Document not found" });
  }
});

/**
 * GET /api/documents/:id/download
 * Download and stream decrypted file content.
 */
router.get("/:id/download", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.session?.address;
    if (!userAddress) return res.status(401).json({ error: "Unauthorized" });

    const { buffer, mimeType, filename } = await DocumentService.downloadDocument(req.params.id, userAddress);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
    return res.send(buffer);
  } catch (err: any) {
    logger.error("[Document Route] Download error:", err);
    return res.status(403).json({ error: err.message || "Download failed" });
  }
});

/**
 * POST /api/documents/:id/share
 * Share document access with a grantee address.
 */
router.post("/:id/share", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.session?.address;
    if (!userAddress) return res.status(401).json({ error: "Unauthorized" });

    const { granteeAddress, permissionType, expiresAt } = req.body;
    if (!granteeAddress) {
      return res.status(400).json({ error: "Missing required field: granteeAddress" });
    }

    const access = await DocumentService.shareDocument(
      req.params.id,
      userAddress,
      granteeAddress,
      permissionType || PermissionType.VIEW,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return res.status(201).json(access);
  } catch (err: any) {
    logger.error("[Document Route] Share error:", err);
    return res.status(400).json({ error: err.message || "Sharing document failed" });
  }
});

/**
 * POST /api/documents/:id/revoke
 * Revoke shared access permission.
 */
router.post("/:id/revoke", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.session?.address;
    if (!userAddress) return res.status(401).json({ error: "Unauthorized" });

    const { accessId } = req.body;
    if (!accessId) {
      return res.status(400).json({ error: "Missing required field: accessId" });
    }

    const revoked = await DocumentService.revokeAccess(req.params.id, userAddress, accessId);
    return res.json(revoked);
  } catch (err: any) {
    logger.error("[Document Route] Revoke error:", err);
    return res.status(400).json({ error: err.message || "Revoking access failed" });
  }
});

/**
 * GET /api/documents/:id/verify-integrity
 * Recalculate file hash and compare against stored record.
 */
router.get("/:id/verify-integrity", requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await DocumentService.verifyIntegrity(_req.params.id);
    return res.json(result);
  } catch (err: any) {
    logger.error("[Document Route] Verify integrity error:", err);
    return res.status(400).json({ error: err.message || "Integrity check failed" });
  }
});

/**
 * POST /api/documents/:id/verify-issuer
 * Perform issuer verification attestation.
 */
router.post("/:id/verify-issuer", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const verifierAddress = req.session?.address;
    if (!verifierAddress) return res.status(401).json({ error: "Unauthorized" });

    const { verificationResult, verificationReference, notes } = req.body;

    const result = await DocumentService.verifyIssuerStatus(
      req.params.id,
      verifierAddress,
      (verificationResult as VerificationStatus) || VerificationStatus.VERIFIED,
      verificationReference,
      notes
    );

    return res.json(result);
  } catch (err: any) {
    logger.error("[Document Route] Issuer verify error:", err);
    return res.status(400).json({ error: err.message || "Issuer verification failed" });
  }
});

/**
 * GET /api/documents/:id/audit-history
 * Get audit history for document.
 */
router.get("/:id/audit-history", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.session?.address;
    if (!userAddress) return res.status(401).json({ error: "Unauthorized" });

    const auditEvents = await DocumentService.getDocumentAuditHistory(req.params.id, userAddress);
    return res.json(auditEvents);
  } catch (err: any) {
    logger.error("[Document Route] Audit history error:", err);
    return res.status(400).json({ error: err.message || "Audit history lookup failed" });
  }
});

/**
 * DELETE /api/documents/:id
 * Soft delete document and remove storage file.
 */
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.session?.address;
    if (!userAddress) return res.status(401).json({ error: "Unauthorized" });

    const deleted = await DocumentService.deleteDocument(req.params.id, userAddress);
    return res.json({ success: true, message: "Document deleted successfully", document: deleted });
  } catch (err: any) {
    logger.error("[Document Route] Delete error:", err);
    return res.status(400).json({ error: err.message || "Document deletion failed" });
  }
});

export default router;
