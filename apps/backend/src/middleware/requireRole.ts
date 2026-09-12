import { Response, NextFunction } from "express";
import { Role } from "@ciphertrust/shared-types";
import { AuthenticatedRequest } from "./requireAuth";

export function requireRole(requiredRole: Role) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.session) {
      return res.status(401).json({ error: "Unauthorized: Missing active authentication session" });
    }

    const hasPermission = req.session.roles.includes(requiredRole) || req.session.roles.includes(Role.ADMIN);
    if (!hasPermission) {
      return res.status(403).json({
        error: `Forbidden: Required role '${requiredRole}' is not held by active session DID`,
      });
    }

    next();
  };
}
