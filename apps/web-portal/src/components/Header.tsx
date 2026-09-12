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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & Logo */}
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
                Unified Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Enterprise Identity & Asset Platform</p>
          </div>
        </div>

        {/* Portal Mode Switcher & Sub-Tabs */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Main Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setPortalMode("user")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                portalMode === "user"
                  ? "bg-white text-sky-700 shadow-sm border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>User Portal</span>
            </button>
            <button
              onClick={() => setPortalMode("admin")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                portalMode === "admin"
                  ? "bg-white text-sky-700 shadow-sm border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span>Admin Console</span>
            </button>
          </div>

          {/* Sub-Tabs for User Mode */}
          {portalMode === "user" && (
            <nav className="flex items-center gap-1 bg-slate-100/70 border border-slate-200/80 p-1 rounded-2xl">
              <button
                onClick={() => setUserTab("did")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  userTab === "did"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-sky-600" />
                <span>DID Identity</span>
              </button>
              <button
                onClick={() => setUserTab("inventory")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  userTab === "inventory"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>Asset Inventory</span>
              </button>
            </nav>
          )}

          {/* Sub-Tabs for Admin Mode */}
          {portalMode === "admin" && (
            <nav className="flex items-center gap-1 bg-slate-100/70 border border-slate-200/80 p-1 rounded-2xl">
              <button
                onClick={() => setAdminTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  adminTab === "dashboard"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setAdminTab("issue")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  adminTab === "issue"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
                <span>Issue Asset</span>
              </button>
              <button
                onClick={() => setAdminTab("roles")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  adminTab === "roles"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>Roles</span>
              </button>
              <button
                onClick={() => setAdminTab("audit")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  adminTab === "audit"
                    ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Audit Logs</span>
              </button>
            </nav>
          )}
        </div>

        {/* Connect Wallet Button */}
        <div className="flex items-center gap-3">
          <ConnectWalletButton
            client={client}
            session={session}
            onSessionChange={onSessionChange}
          />
        </div>
      </div>
    </header>
  );
};
