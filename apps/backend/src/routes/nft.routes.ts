import { Router, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { NftService } from "../services/nft.service";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { Role } from "@ciphertrust/shared-types";

const router = Router();

/**
 * POST /nft/mint
 * Restricted to ISSUER / ADMIN roles. Mints a new NFT asset to a target recipient address.
 */
router.post(
  "/mint",
  requireAuth,
  requireRole(Role.ISSUER),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { recipientAddress, name, description, image, attributes } = req.body;
    if (!recipientAddress || !name || !description || !image) {
      return res.status(400).json({ error: "Missing required fields for NFT minting" });
    }

    const issuerAddress = req.session!.address;
    const asset = await NftService.mintNft(
      issuerAddress,
      recipientAddress,
      name,
      description,
      image,
      attributes || []
    );

    res.status(201).json(asset);
  })
);

/**
 * POST /nft/transfer
 * Transfers ownership of an asset to a target recipient address.
 */
router.post(
  "/transfer",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tokenId, contractAddress, recipientAddress } = req.body;
    if (!tokenId || !recipientAddress) {
      return res.status(400).json({ error: "Missing required fields 'tokenId' and 'recipientAddress'" });
    }

    const senderAddress = req.session!.address;
    const asset = await NftService.transferAsset(
      senderAddress,
      recipientAddress,
      tokenId,
      contractAddress || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    );

    res.json(asset);
  })
);

/**
 * GET /nft/inventory/:didOrAddress
 * Returns digital assets owned by specified DID or wallet address.
 */
router.get(
  "/inventory/:didOrAddress",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { didOrAddress } = req.params;
    const inventory = await NftService.getInventoryByDid(didOrAddress);
    res.json(inventory);
  })
);

export default router;
