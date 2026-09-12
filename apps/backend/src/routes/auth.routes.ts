import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthService } from "../services/auth.service";

const router = Router();

/**
 * POST /auth/nonce
 * Generates SIWE authentication nonce for a target wallet address.
 */
router.post(
  "/nonce",
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Missing required field 'address'" });
    }

    const nonce = AuthService.createNonce(address);
    res.json({ nonce });
  })
);

/**
 * POST /auth/verify
 * Verifies SIWE message signature and issues signed JWT AuthSession.
 */
router.post(
  "/verify",
  asyncHandler(async (req: Request, res: Response) => {
    const { message, signature } = req.body;
    if (!message || !signature) {
      return res.status(400).json({ error: "Missing required SIWE payload fields 'message' and 'signature'" });
    }

    const result = await AuthService.verifySiweAndAuthenticate(message, signature);
    res.json(result);
  })
);

export default router;
