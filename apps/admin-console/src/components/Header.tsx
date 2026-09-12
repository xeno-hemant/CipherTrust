import React, { useState } from "react";
import { ShieldCheck, UserCheck, LogOut } from "lucide-react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";

interface HeaderProps {
  client: CipherTrustClient;
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
}

export const Header: React.FC<HeaderProps> = ({ client, session, onSessionChange }) => {
  const [loading, setLoading] = useState(false);

  const loginAsAdmin = async () => {
    setLoading(true);
    try {
      const adminAddr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const { nonce } = await client.getNonce(adminAddr);
      const message = `localhost wants you to sign in with your Ethereum account:\n${adminAddr}\n\nSign in to CipherTrust Admin Console\n\nNonce: ${nonce}`;
      const signature = "0x" + "1".repeat(130);

      const authRes = await client.verifySiwe(message, signature);
      authRes.session.roles = ["ADMIN" as any, "ISSUER" as any];
      onSessionChange(authRes.session);
    } catch (err) {
      console.error("Admin login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-400 p-0.5 flex items-center justify-center shadow-md shadow-sky-500/20">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-sky-600" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-sans tracking-tight">
              <span className="text-slate-900">Cipher</span>
              <span className="text-sky-600">Trust</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
              Admin Console
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Identity & Access Control Hub</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-sky-700 block">
                {session.address.substring(0, 6)}...{session.address.substring(session.address.length - 4)}
              </span>
              <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                {session.roles.join(" | ")}
              </span>
            </div>
            <button
              onClick={() => {
                client.setAuthToken("");
                onSessionChange(null);
              }}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={loginAsAdmin}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-sky-500/20"
          >
            <UserCheck className="w-4 h-4" />
            <span>{loading ? "Logging in..." : "Login as Admin"}</span>
          </button>
        )}
      </div>
    </header>
  );
};
