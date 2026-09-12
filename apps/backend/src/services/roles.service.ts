import { ethers } from "ethers";
import { prisma } from "../db/prisma";
import { Role, RoleAssignment } from "@ciphertrust/shared-types";
import { DidService } from "./did.service";
import { MemoryStore } from "../db/memoryStore";
import { AuditService } from "./audit.service";

export class RolesService {
  static async assignRole(
    adminAddress: string,
    targetDidOrAddress: string,
    role: Role
  ): Promise<RoleAssignment> {
    let did = targetDidOrAddress;
    if (!targetDidOrAddress.startsWith("did:ethr:")) {
      did = DidService.formatDid(targetDidOrAddress);
    }

    const assignment: RoleAssignment = {
      did,
      role,
      assignedBy: ethers.getAddress(adminAddress),
      assignedAt: new Date().toISOString(),
      active: true,
    };

    try {
      await prisma.roleAssignment.create({
        data: {
          did,
          role: role as any,
          assignedBy: ethers.getAddress(adminAddress),
          active: true,
        },
      });
    } catch (e) {
      MemoryStore.roles.push(assignment);
    }

    try {
      await AuditService.logOnChainAudit("ROLE_ASSIGNED", adminAddress, did, {
        role,
        assignedBy: adminAddress,
      });
    } catch (e) {
      // Standby
    }

    return assignment;
  }

  static async revokeRole(
    adminAddress: string,
    targetDidOrAddress: string,
    role: Role
  ): Promise<boolean> {
    let did = targetDidOrAddress;
    if (!targetDidOrAddress.startsWith("did:ethr:")) {
      did = DidService.formatDid(targetDidOrAddress);
    }

    try {
      await prisma.roleAssignment.updateMany({
        where: { did, role: role as any, active: true },
        data: { active: false },
      });
    } catch (e) {
      MemoryStore.roles = MemoryStore.roles.filter(
        (r) => !(r.did.toLowerCase() === did.toLowerCase() && r.role === role)
      );
    }

    // Log ROLE_REVOKED audit event
    try {
      await AuditService.logOnChainAudit("ROLE_REVOKED", adminAddress, did, {
        role,
        revokedBy: adminAddress,
      });
    } catch (e) {
      // Standby
    }

    return true;
  }

  static async getRolesForDid(targetDidOrAddress: string): Promise<RoleAssignment[]> {
    let did = targetDidOrAddress;
    if (!targetDidOrAddress.startsWith("did:ethr:")) {
      did = DidService.formatDid(targetDidOrAddress);
    }

    try {
      const assignments = await prisma.roleAssignment.findMany({
        where: { did, active: true },
      });

      if (assignments.length > 0) {
        return assignments.map((a: any) => ({
          did: a.did,
          role: a.role as Role,
          assignedBy: a.assignedBy,
          assignedAt: a.assignedAt.toISOString(),
          active: a.active,
        }));
      }
    } catch (e) {
      // Fallback
    }

    const memRoles = MemoryStore.roles.filter((r) => r.did.toLowerCase() === did.toLowerCase() && r.active);
    return memRoles;
  }
}
