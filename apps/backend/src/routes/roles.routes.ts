import { Router, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { RolesService } from "../services/roles.service";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { Role } from "@ciphertrust/shared-types";

const router = Router();

/**
 * POST /roles/assign
 * Restricted to ADMIN role. Assigns a platform role to a target DID.
 */
router.post(
  "/assign",
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { did, role } = req.body;
    if (!did || !role) {
      return res.status(400).json({ error: "Missing required fields 'did' and 'role'" });
    }

    const adminAddress = req.session!.address;
    const assignment = await RolesService.assignRole(adminAddress, did, role as Role);
    res.status(201).json(assignment);
  })
);

/**
 * POST /roles/revoke
 * Restricted to ADMIN role. Revokes a platform role from a target DID.
 */
router.post(
  "/revoke",
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { did, role } = req.body;
    if (!did || !role) {
      return res.status(400).json({ error: "Missing required fields 'did' and 'role'" });
    }

    const adminAddress = req.session!.address;
    await RolesService.revokeRole(adminAddress, did, role as Role);
    res.json({ success: true, message: `Role '${role}' revoked successfully from ${did}` });
  })
);

/**
 * GET /roles/:didOrAddress
 * Returns list of active roles assigned to a DID.
 */
router.get(
  "/:didOrAddress",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { didOrAddress } = req.params;
    const roles = await RolesService.getRolesForDid(didOrAddress);
    res.json(roles);
  })
);

export default router;
