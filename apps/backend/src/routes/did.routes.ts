import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { DidService } from "../services/did.service";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";

const router = Router();

/**
 * POST /did/create
 * Derives and registers a Decentralized Identifier for the authenticated wallet address.
 */
router.post(
  "/create",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const address = req.body.address || req.session?.address;
    if (!address) {
      return res.status(400).json({ error: "Missing controller address" });
    }

    const doc = await DidService.createDid(address);
    res.status(201).json(doc);
  })
);

/**
 * GET /did/:addressOrDid
 * Resolves a DID document by address or DID string.
 */
router.get(
  "/:addressOrDid",
  asyncHandler(async (req: Request, res: Response) => {
    const { addressOrDid } = req.params;
    const doc = await DidService.getDid(addressOrDid);
    if (!doc) {
      return res.status(404).json({ error: "DID document not found" });
    }
    res.json(doc);
  })
);

export default router;
