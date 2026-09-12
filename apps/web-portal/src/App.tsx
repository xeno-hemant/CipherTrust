import React, { useState } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";
import { Header, PortalMode, UserTab } from "./components/Header";
import { DidDashboardPage } from "./components/DidDashboardPage";
import { AssetInventoryPage } from "./components/AssetInventoryPage";
import { LoginLandingScreen } from "./components/LoginLandingScreen";

// Admin components
import { Sidebar, AdminTab } from "./components/admin/Sidebar";
import { DashboardOverview } from "./components/admin/DashboardOverview";
import { IssueAssetPage } from "./components/admin/IssueAssetPage";
import { RoleManagementPage } from "./components/admin/RoleManagementPage";
import { AuditLogPage } from "./components/admin/AuditLogPage";

const API_URL = (import.meta as any).env?.VITE_API_URL || "https://ciphertrust-backend.onrender.com/api";

const client = new CipherTrustClient({
  baseUrl: API_URL,
});

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [portalMode, setPortalMode] = useState<PortalMode>("user");
  const [userTab, setUserTab] = useState<UserTab>("did");
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");

  if (!session) {
    return <LoginLandingScreen client={client} onLoginSuccess={setSession} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Header
        client={client}
        session={session}
        onSessionChange={setSession}
        portalMode={portalMode}
        setPortalMode={setPortalMode}
        userTab={userTab}
        setUserTab={setUserTab}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
      />

      {portalMode === "user" ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {userTab === "did" ? (
            <DidDashboardPage client={client} session={session} />
          ) : (
            <AssetInventoryPage client={client} session={session} />
          )}
        </main>
      ) : (
        <div className="flex flex-1 max-w-7xl w-full mx-auto">
          <Sidebar activeTab={adminTab} setActiveTab={setAdminTab} />
          <main className="flex-1 p-6 md:p-8">
            {adminTab === "dashboard" && <DashboardOverview client={client} />}
            {adminTab === "issue" && <IssueAssetPage client={client} />}
            {adminTab === "roles" && <RoleManagementPage client={client} />}
            {adminTab === "audit" && <AuditLogPage client={client} />}
          </main>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs font-medium text-slate-500">
        <p>CipherTrust Enterprise Identity & Asset Platform &copy; 2026. Powered by OpenZeppelin, Hardhat & W3C DID Standard.</p>
      </footer>
    </div>
  );
};

export default App;
