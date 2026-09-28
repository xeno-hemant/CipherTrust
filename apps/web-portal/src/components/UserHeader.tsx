import React from "react";
import { ShieldCheck, Database, Layers, FileCheck, Shield, ArrowRight } from "lucide-react";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";

export type UserTab = "did" | "kyc" | "inventory" | "documents";

interface UserHeaderProps {
  client: CipherTrustClient;
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
  userTab: UserTab;
  setUserTab: (tab: UserTab) => void;
  onNavigateToAdmin?: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  client,
  session,
  onSessionChange,
  userTab,
  setUserTab,
  onNavigateToAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm font-sans">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-400 p-0.5 flex items-center justify-center shadow-md shadow-sky-500/20 flex-shrink-0">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight">
                <span className="text-slate-900">Cipher</span>
                <span className="text-sky-600">Trust</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-full">
                USER PORTAL
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">
              Decentralized Identity, KYC Verification & Document Vault
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-sm active:scale-95"
              title="Go to Admin Console"
            >
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Admin Console (/admin)</span>
              <span className="sm:hidden">Admin</span>
              <ArrowRight className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>
          )}

          <ConnectWalletButton
            client={client}
            session={session}
            onSessionChange={onSessionChange}
          />
        </div>
      </div>

      {/* Sub Navigation Bar — User Tabs */}
      <div className="bg-slate-50 border-t border-slate-200/80 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setUserTab("did")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                userTab === "did"
                  ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-sky-600" />
              <span>DID Identity</span>
            </button>
            <button
              onClick={() => setUserTab("kyc")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                userTab === "kyc"
                  ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>KYC Verification</span>
            </button>
            <button
              onClick={() => setUserTab("inventory")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                userTab === "inventory"
                  ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Asset Inventory</span>
            </button>
            <button
              onClick={() => setUserTab("documents")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                userTab === "documents"
                  ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>My Documents</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

