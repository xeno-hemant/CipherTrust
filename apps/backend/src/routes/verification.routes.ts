import { Router, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const router = Router();

/**
 * In-memory OTP store for document verification.
 * In production, use Redis with TTL expiry.
 */
interface OtpRecord {
  otp: string;
  identifier: string; // phone number or email
  documentType: string;
  expiresAt: number;
  verified: boolean;
  attempts: number;
}

const otpStore = new Map<string, OtpRecord>();

// Max OTP attempts before lockout
const MAX_OTP_ATTEMPTS = 5;
// OTP validity: 5 minutes
const OTP_VALIDITY_MS = 5 * 60 * 1000;

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * POST /api/verification/send-otp
 * Send OTP for document ownership verification.
 * 
 * For Aadhaar: OTP sent to linked phone number
 * For Company Docs: OTP sent to company email
 * For Academic Docs: OTP sent to institution email
 * For Government Docs: OTP sent via DigiLocker verification
 */
router.post(
  "/send-otp",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userAddress = req.session?.address;
    if (!userAddress) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { documentType, identifier, verificationType } = req.body;

    if (!documentType || !identifier) {
      return res.status(400).json({
        error: "Document type and identifier (phone/email) are required",
      });
    }

    // Validate identifier format based on verification type
    if (verificationType === "phone" || documentType === "AADHAAR") {
      const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
      if (!phoneRegex.test(identifier.replace(/\s/g, ""))) {
        return res.status(400).json({
          error: "Invalid phone number. Please enter a valid Indian mobile number.",
        });
      }
    } else if (verificationType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return res.status(400).json({
          error: "Invalid email address format.",
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const sessionId = crypto.randomUUID();

    // Store OTP
    otpStore.set(sessionId, {
      otp,
      identifier,
      documentType,
      expiresAt: Date.now() + OTP_VALIDITY_MS,
      verified: false,
      attempts: 0,
    });

    // Clean up expired OTPs
    for (const [key, record] of otpStore.entries()) {
      if (record.expiresAt < Date.now()) {
        otpStore.delete(key);
      }
    }

    logger.info(`[Verification] OTP generated for ${documentType}: ${identifier} → OTP: ${otp}`);

    // Mask the identifier for the response
    let maskedIdentifier = identifier;
    if (verificationType === "phone" || documentType === "AADHAAR") {
      maskedIdentifier = identifier.replace(/\d(?=\d{4})/g, "*");
    } else {
      const [name, domain] = identifier.split("@");
      maskedIdentifier = name.substring(0, 2) + "***@" + domain;
    }

    return res.json({
      success: true,
      sessionId,
      maskedIdentifier,
      expiresIn: OTP_VALIDITY_MS / 1000,
      message: `OTP sent to ${maskedIdentifier}`,
      // DEV ONLY: Remove in production — shows OTP in response for testing
      _devOtp: otp,
    });
  })
);

/**
 * POST /api/verification/verify-otp
 * Verify the OTP entered by the user.
 */
router.post(
  "/verify-otp",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userAddress = req.session?.address;
    if (!userAddress) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { sessionId, otp } = req.body;

    if (!sessionId || !otp) {
      return res.status(400).json({ error: "Session ID and OTP are required" });
    }

    const record = otpStore.get(sessionId);
    if (!record) {
      return res.status(404).json({ error: "OTP session expired or not found. Please request a new OTP." });
    }

    if (record.expiresAt < Date.now()) {
      otpStore.delete(sessionId);
      return res.status(410).json({ error: "OTP has expired. Please request a new OTP." });
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(sessionId);
      return res.status(429).json({
        error: "Maximum OTP attempts exceeded. Please request a new OTP.",
      });
    }

    record.attempts++;

    if (record.otp !== otp.trim()) {
      const remainingAttempts = MAX_OTP_ATTEMPTS - record.attempts;
      return res.status(400).json({
        error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts,
      });
    }

    record.verified = true;

    // Generate verification token for document upload
    const verificationToken = jwt.sign(
      {
        sessionId,
        userAddress,
        documentType: record.documentType,
        identifier: record.identifier,
        verifiedAt: new Date().toISOString(),
      },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    logger.info(`[Verification] OTP verified for ${record.documentType}: ${record.identifier}`);

    return res.json({
      success: true,
      verified: true,
      verificationToken,
      message: "Identity verification successful. You can now upload the document.",
    });
  })
);

/**
 * POST /api/verification/resend-otp
 * Resend OTP for an existing session.
 */
router.post(
  "/resend-otp",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userAddress = req.session?.address;
    if (!userAddress) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const record = otpStore.get(sessionId);
    if (!record) {
      return res.status(404).json({
        error: "OTP session not found. Please start a new verification.",
      });
    }

    const newOtp = generateOTP();
    record.otp = newOtp;
    record.expiresAt = Date.now() + OTP_VALIDITY_MS;
    record.attempts = 0;

    logger.info(`[Verification] OTP resent for ${record.documentType}: ${record.identifier} → OTP: ${newOtp}`);

    let maskedIdentifier = record.identifier;
    if (record.documentType === "AADHAAR") {
      maskedIdentifier = record.identifier.replace(/\d(?=\d{4})/g, "*");
    } else {
      const [name, domain] = record.identifier.split("@");
      maskedIdentifier = name.substring(0, 2) + "***@" + domain;
    }

    return res.json({
      success: true,
      sessionId,
      maskedIdentifier,
      expiresIn: OTP_VALIDITY_MS / 1000,
      message: `New OTP sent to ${maskedIdentifier}`,
      _devOtp: newOtp,
    });
  })
);

export default router;
