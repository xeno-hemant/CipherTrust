import React, { useState, useEffect } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { Role, RoleAssignment } from "@ciphertrust/shared-types";
import { Users, UserPlus, RefreshCw, Trash2 } from "lucide-react";

interface RoleManagementPageProps {
  client: CipherTrustClient;
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.ADMIN]: "ADMIN (Full control)",
  [Role.ISSUER]: "ISSUER (Can mint verifiable assets)",
  [Role.VERIFIER]: "VERIFIER (Can audit & verify credentials)",
  [Role.HOLDER]: "HOLDER (Can only own digital assets)",
};

export const RoleManagementPage: React.FC<RoleManagementPageProps> = ({ client }) => {
  const [targetDid, setTargetDid] = useState("did:ethr:31337:0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [selectedRole, setSelectedRole] = useState<Role>(Role.ISSUER);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const rolesList = await client.getRoles(targetDid);
      setAssignments(rolesList);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [targetDid]);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);
    try {
      await client.assignRole(targetDid, selectedRole);
      setMsg(`Role '${selectedRole}' assigned on-chain successfully.`);
      await fetchRoles();
    } catch (err: any) {
      setMsg(`Error: ${err.message || "Failed to assign role"}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeRole = async (roleToRevoke: Role) => {
    setActionLoading(true);
    setMsg(null);
    try {
      await client.revokeRole(targetDid, roleToRevoke);
      setMsg(`Role '${roleToRevoke}' revoked successfully.`);
      await fetchRoles();
    } catch (err: any) {
      setMsg(`Error: ${err.message || "Failed to revoke role"}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-sky-600" />
          On-Chain RBAC Role Management
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Manage permission roles enforced cross-contract via <code className="font-bold text-sky-700">CipherTrustRBAC</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Assign Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="w-4 h-4 text-sky-600" /> Assign On-Chain Role
          </h3>

          <form onSubmit={handleAssignRole} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Target Wallet Address / DID
              </label>
              <input
                type="text"
                required
                value={targetDid}
                onChange={(e) => setTargetDid(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-sky-700 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Select Role to Grant
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              >
                {Object.values(Role).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_DESCRIPTIONS[r]}
                  </option>
                ))}
              </select>
            </div>

            {msg && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs font-semibold text-sky-800">
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-extrabold py-3 rounded-xl transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {actionLoading ? "Updating State..." : "Execute Role Assignment"}
            </button>
          </form>
        </div>

        {/* Roles Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Active Permissions for DID</h3>
              <span className="text-xs font-mono font-bold text-sky-700">{targetDid}</span>
            </div>
            <button
              onClick={fetchRoles}
              disabled={loading}
              className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
            </button>
          </div>

          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                No custom assigned roles found. Default HOLDER access level active.
              </div>
            ) : (
              assignments.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-sky-600 shadow-sm shadow-sky-500/50" />
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">{item.role}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Assigned By: {item.assignedBy.substring(0, 10)}... | {new Date(item.assignedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeRole(item.role)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Revoke Role
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
