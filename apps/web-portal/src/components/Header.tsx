import React from "react";
import { ShieldCheck, Database, Layers, ExternalLink } from "lucide-react";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";

interface HeaderProps {
  client: CipherTrustClient;
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
  activeTab: "did" | "inventory";
  setActiveTab: (tab: "did" | "inventory") => void;
}

export const Header: React.FC<HeaderProps> = ({
  client,
  session,
  onSessionChange,
  activeTab,
  setActiveTab,
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
                Portal v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Verifiable Identity & Asset Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("did")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "did"
                ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Database className="w-4 h-4 text-sky-600" />
            <span>DID Identity</span>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "inventory"
                ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Digital Asset Inventory</span>
          </button>
        </nav>

        {/* Wallet Connect & Admin Console Link */}
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3006"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 px-3.5 py-2.5 rounded-xl transition-all"
          >
            <span>Admin Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

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
