import React from "react";
import { ShieldCheck, Database, Layers, LayoutDashboard, PlusCircle, Users, FileText, UserCheck, Shield } from "lucide-react";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";
import { AdminTab } from "./admin/Sidebar";

export type PortalMode = "user" | "admin";
export type UserTab = "did" | "inventory";

interface HeaderProps {
  client: CipherTrustClient;
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  userTab: UserTab;
  setUserTab: (tab: UserTab) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  client,
  session,
  onSessionChange,
  portalMode,
  setPortalMode,
  userTab,
  setUserTab,
  adminTab,
  setAdminTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
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
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-sky-700 border border-sky-200 px-1.5 sm:px-2 py-0.5 rounded-full">
                UNIFIED
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">
              Enterprise Identity & Asset Platform
            </p>
          </div>
        </div>

        {/* Connect Wallet Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ConnectWalletButton
            client={client}
            session={session}
            onSessionChange={onSessionChange}
          />
        </div>
      </div>

      {/* Sub Navigation Bar (Mobile & Desktop Accessible) */}
      <div className="bg-slate-50 border-t border-slate-200/80 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Main Mode Toggle */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
            <button
              onClick={() => setPortalMode("user")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap ${
                portalMode === "user"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>User Portal</span>
            </button>
            <button
              onClick={() => setPortalMode("admin")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap ${
                portalMode === "admin"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          </div>

          {/* Sub-Tabs for User Mode */}
          {portalMode === "user" && (
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
            </nav>
          )}

          {/* Sub-Tabs for Admin Mode */}
          {portalMode === "admin" && (
            <nav className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setAdminTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  adminTab === "dashboard"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setAdminTab("issue")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  adminTab === "issue"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
                <span>Issue Asset</span>
              </button>
              <button
                onClick={() => setAdminTab("roles")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  adminTab === "roles"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>Roles</span>
              </button>
              <button
                onClick={() => setAdminTab("audit")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  adminTab === "audit"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Audit Logs</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};
