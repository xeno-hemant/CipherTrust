import { Router, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { Role, KycStatus, SubmitKycRequest, ReviewKycRequest } from "@ciphertrust/shared-types";
import { KycService } from "../services/kyc.service";

const router = Router();

/**
 * POST /api/kyc/submit
 * User submits their KYC details
 */
router.post(
  "/submit",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userAddress = req.session?.address;
    if (!userAddress) {
      return res.status(401).json({ error: "Unauthorized session" });
    }

    const { fullName, idType, idNumber, dateOfBirth, nationality, documentFilename, documentData, selfieData, phone, email } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: "Full legal name is required" });
    }
    if (!idType) {
      return res.status(400).json({ error: "ID document type is required" });
    }
    if (!idNumber || !idNumber.trim()) {
      return res.status(400).json({ error: "Government ID number is required" });
    }

    const submission: SubmitKycRequest = {
      fullName: fullName.trim(),
      dateOfBirth,
      nationality,
      idType,
      idNumber: idNumber.trim(),
      documentFilename,
      documentData,
      selfieData,
      phone,
      email,
    };

    const application = await KycService.submitKyc(userAddress, submission);
    return res.status(201).json(application);
  })
);

/**
 * GET /api/kyc/status
 * Get the current user's KYC application status
 */
router.get(
  "/status",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userAddress = req.session?.address;
    if (!userAddress) {
      return res.status(401).json({ error: "Unauthorized session" });
    }

    const status = await KycService.getKycStatus(userAddress);
    return res.json(status);
  })
);

/**
 * GET /api/kyc/applications
 * Admin: List all submitted KYC applications (supports ?status=PENDING, etc.)
 */
router.get(
  "/applications",
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;
    const applications = await KycService.getKycApplications(statusFilter);
    return res.json(applications);
  })
);

/**
 * GET /api/kyc/applications/:id
 * Admin: Get details of a single KYC application
 */
router.get(
  "/applications/:id",
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const application = await KycService.getKycApplicationById(id);
    if (!application) {
      return res.status(404).json({ error: "KYC application not found" });
    }
    return res.json(application);
  })
);

/**
 * POST /api/kyc/applications/:id/review
 * Admin: Approve or Reject a KYC application
 */
router.post(
  "/applications/:id/review",
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const reviewerAddress = req.session?.address;
    if (!reviewerAddress) {
      return res.status(401).json({ error: "Unauthorized session" });
    }

    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!status || (status !== KycStatus.APPROVED && status !== KycStatus.REJECTED)) {
      return res.status(400).json({ error: "Status must be either APPROVED or REJECTED" });
    }

    const review: ReviewKycRequest = {
      status,
      reviewNotes,
    };

    const application = await KycService.reviewKyc(id, reviewerAddress, review);
    return res.json(application);
  })
);

export default router;
