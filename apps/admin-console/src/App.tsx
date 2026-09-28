import React, { useState } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";
import { AdminLoginScreen } from "./components/AdminLoginScreen";
import { Header } from "./components/Header";
import { Sidebar, AdminTab } from "./components/Sidebar";
import { DashboardOverview } from "./pages/DashboardOverview";
import { IssueAssetPage } from "./pages/IssueAssetPage";
import { RoleManagementPage } from "./pages/RoleManagementPage";
import { AuditLogPage } from "./pages/AuditLogPage";

const envUrl =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL;

const isLocalDev =
  typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_URL = envUrl || (isLocalDev || (import.meta as any).env?.DEV ? "http://localhost:4005/api" : "https://ciphertrust-backend.onrender.com/api");

const client = new CipherTrustClient({
  baseUrl: API_URL,
});

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  // Show admin login screen if not authenticated
  if (!session) {
    return (
      <AdminLoginScreen
        client={client}
        onLoginSuccess={setSession}
        apiUrl={API_URL}
      />
    );
  }

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
