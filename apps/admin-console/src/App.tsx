import React, { useState } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";
import { Header } from "./components/Header";
import { Sidebar, AdminTab } from "./components/Sidebar";
import { DashboardOverview } from "./pages/DashboardOverview";
import { IssueAssetPage } from "./pages/IssueAssetPage";
import { RoleManagementPage } from "./pages/RoleManagementPage";
import { AuditLogPage } from "./pages/AuditLogPage";

const API_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL ||
  "https://ciphertrust-backend.onrender.com/api";

const client = new CipherTrustClient({
  baseUrl: API_URL,
});

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>({
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    did: "did:ethr:31337:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    roles: ["ADMIN" as any, "ISSUER" as any],
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  });
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Header client={client} session={session} onSessionChange={setSession} />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl">
          {activeTab === "dashboard" && <DashboardOverview client={client} />}
          {activeTab === "issue" && <IssueAssetPage client={client} />}
          {activeTab === "roles" && <RoleManagementPage client={client} />}
          {activeTab === "audit" && <AuditLogPage client={client} />}
        </main>
      </div>
    </div>
  );
};

export default App;
