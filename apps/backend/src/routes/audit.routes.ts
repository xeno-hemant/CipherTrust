import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuditService } from "../services/audit.service";

const router = Router();

/**
 * GET /audit
 * Returns paginated system audit log entries.
 * Query params: eventType, actor, targetDid, page, limit
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { eventType, actor, targetDid, page, limit } = req.query;

    const filter = {
      eventType: eventType as string | undefined,
      actor: actor as string | undefined,
      targetDid: targetDid as string | undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
    };

    const result = await AuditService.getAuditLogs(filter);
    res.json(result);
  })
);

export default router;
