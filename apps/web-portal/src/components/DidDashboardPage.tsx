import React, { useState, useEffect } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession, DIDDocument, RoleAssignment } from "@ciphertrust/shared-types";
import { ShieldCheck, Copy, Check, Key, User, Calendar, Shield, Cpu, RefreshCw } from "lucide-react";

interface DidDashboardPageProps {
  client: CipherTrustClient;
  session: AuthSession | null;
}

export const DidDashboardPage: React.FC<DidDashboardPageProps> = ({ client, session }) => {
  const [didDoc, setDidDoc] = useState<DIDDocument | null>(null);
  const [roles, setRoles] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const address = session?.address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  const fetchDidDetails = async () => {
    setLoading(true);
    try {
      let doc = await client.getDid(address);
      if (!doc && session) {
        doc = await client.createDid(session.address);
      }
      setDidDoc(doc);

      const rolesList = await client.getRoles(address);
      setRoles(rolesList);
    } catch (err) {
      console.error("Failed to load DID document:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDidDetails();
  }, [session, address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 to-sky-500 p-8 text-white shadow-xl shadow-sky-500/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-white/20 text-white backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Decentralized Identity Active
              </span>
              <span className="bg-white/10 text-white backdrop-blur-md text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
                Chain ID: 31337 (Localhost)
              </span>
            </div>
            <h2 className="text-3xl font-black text-white mt-3 font-sans tracking-tight">
              Verifiable DID Profile
            </h2>
            <p className="text-sky-100 text-sm mt-1 max-w-2xl font-medium">
              Cryptographically derived W3C-compliant Decentralized Identifier tied to your Ethereum wallet address with on-chain RBAC capabilities.
            </p>
          </div>

          <button
            onClick={fetchDidDetails}
            disabled={loading}
            className="flex items-center gap-2 bg-white text-sky-700 hover:bg-sky-50 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
            <span>Refresh Identity</span>
          </button>
        </div>
      </div>

      {/* Main DID Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-600" />
              DID Document Details
            </h3>
            {didDoc?.verified && (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Decentralized Identifier (DID)
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="font-mono text-sm font-bold text-sky-700 break-all flex-1">
                  {didDoc?.did || `did:ethr:31337:${address}`}
                </span>
                <button
                  onClick={() => copyToClipboard(didDoc?.did || `did:ethr:31337:${address}`)}
                  className="p-2 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                  title="Copy DID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Controller Address
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-mono text-xs font-semibold text-slate-800 truncate">
                    {didDoc?.controllerAddress || address}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Created At
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">
                    {didDoc ? new Date(didDoc.createdAt).toLocaleString() : "Just now"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Public Cryptographic Key
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-mono text-xs font-semibold text-slate-600 break-all">
                  {didDoc?.publicKey || `pub_${address}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Side Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-600" />
              Role Assignments
            </h3>
            <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full font-bold">
              {roles.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {roles.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Shield className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">Default Holder role active</p>
              </div>
            ) : (
              roles.map((r, idx) => (
                <div
                  key={idx}
                  className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-600 shadow-sm shadow-sky-500/50" />
                    <span className="font-bold text-sm text-slate-900">{r.role}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-white text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-800 font-medium leading-relaxed">
            Role assignments are verified on-chain via the <code className="font-bold text-sky-900">CipherTrustRBAC</code> contract before granting minting or administration privileges.
          </div>
        </div>
      </div>
    </div>
  );
};
