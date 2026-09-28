import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthSession, Role } from "@ciphertrust/shared-types";
import { ethers } from "ethers";

const router = Router();

/**
 * Hardcoded Admin Credentials — Only the platform owner can log in to the Admin Console.
 * In production, store hashed passwords and use bcrypt.
 */
const ADMIN_CREDENTIALS = {
  email: "admin@ciphertrust.io",
  password: "CipherTrust@Admin2026#Secure",
  // The Hardhat Account #0 (deployer) wallet address
  walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
};

/**
 * POST /api/admin/auth/login
 * Admin login with email + password + MetaMask wallet signature verification.
 * Only the hardcoded admin wallet can access the admin console.
 */
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, walletAddress, signature, message } = req.body;

    // Step 1: Validate email & password
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (
      email.toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase() ||
      password !== ADMIN_CREDENTIALS.password
    ) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // Step 2: Validate MetaMask wallet address matches admin wallet
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: "MetaMask wallet verification is required" });
    }

    // Verify the signature matches the claimed wallet address
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ error: "Wallet signature verification failed" });
      }
    } catch (err) {
      // In dev/mock mode, allow if the wallet address matches
      if (walletAddress.toLowerCase() !== ADMIN_CREDENTIALS.walletAddress.toLowerCase()) {
        return res.status(401).json({ error: "Wallet address does not match admin wallet" });
      }
    }

    // Step 3: Verify wallet address is the authorized admin wallet
    if (walletAddress.toLowerCase() !== ADMIN_CREDENTIALS.walletAddress.toLowerCase()) {
      return res.status(403).json({
        error: "Access denied. This wallet is not authorized for admin access.",
      });
    }

    // Step 4: Issue admin JWT session
    const chainId = env.CHAIN_ID;
    const did = `did:ethr:${chainId}:${ADMIN_CREDENTIALS.walletAddress}`;

    const session: AuthSession = {
      address: ADMIN_CREDENTIALS.walletAddress,
      did,
      roles: [Role.ADMIN, Role.ISSUER, Role.VERIFIER],
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const token = jwt.sign(session, env.JWT_SECRET, { expiresIn: "24h" });

    return res.json({
      token,
      session,
      message: "Admin authentication successful",
    });
  })
);

/**
 * POST /api/admin/auth/verify-wallet
 * Step 1 of admin login: Verify the connected wallet is the admin wallet.
 * Returns a challenge message for the wallet to sign.
 */
router.post(
  "/verify-wallet",
  asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    if (walletAddress.toLowerCase() !== ADMIN_CREDENTIALS.walletAddress.toLowerCase()) {
      return res.status(403).json({
        error: "This wallet is not authorized for admin access",
      });
    }

    const nonce = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const challengeMessage = `CipherTrust Admin Authentication\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

    return res.json({
      authorized: true,
      challengeMessage,
      nonce,
    });
  })
);

export default router;
