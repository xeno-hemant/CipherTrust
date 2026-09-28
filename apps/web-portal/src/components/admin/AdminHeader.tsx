import React from "react";
import { ShieldCheck, LogOut, ArrowRight, UserCheck, Shield } from "lucide-react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";

interface AdminHeaderProps {
  client: CipherTrustClient;
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
  onNavigateToUser: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  client,
  session,
  onSessionChange,
  onNavigateToUser,
}) => {
  return (
    <header className="h-16 sm:h-20 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Brand & Mode */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-400 p-0.5 flex items-center justify-center shadow-md shadow-sky-500/20 flex-shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight">
              <span className="text-white">Cipher</span>
              <span className="text-sky-400">Trust</span>
            </h1>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
              ADMIN CONSOLE
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block">
            Identity, RBAC, Asset Minting & KYC Compliance
          </span>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Switch to User Portal Button */}
        <button
          onClick={onNavigateToUser}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
        >
          <UserCheck className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Switch to User Portal</span>
          <span className="sm:hidden">User View</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
        </button>

        {session && (
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-mono font-bold text-sky-400 block">
                {session.address.substring(0, 6)}...{session.address.substring(session.address.length - 4)}
              </span>
              <span className="text-[10px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20 px-1.5 py-0.5 rounded">
                ADMIN
              </span>
            </div>

            <button
              onClick={() => {
                client.setAuthToken("");
                onSessionChange(null);
              }}
              title="Logout Admin"
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
