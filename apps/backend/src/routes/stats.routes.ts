import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../db/prisma";
import { SystemStats } from "@ciphertrust/shared-types";

const router = Router();

/**
 * GET /stats
 * Returns high-level platform statistics for Admin Console.
 */
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalDids, totalNfts, activeRolesCount, auditEventsLast24h] = await Promise.all([
      prisma.didDocument.count(),
      prisma.nftAsset.count(),
      prisma.roleAssignment.count({ where: { active: true } }),
      prisma.auditLogEntry.count({
        where: {
          timestamp: { gte: twentyFourHoursAgo },
        },
      }),
    ]);

    const stats: SystemStats = {
      totalDids,
      totalNfts,
      activeRolesCount,
      auditEventsLast24h,
    };

    res.json(stats);
  })
);

export default router;
