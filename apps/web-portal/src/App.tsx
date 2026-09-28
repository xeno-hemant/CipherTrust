import React, { useState, useEffect } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";

// User components
import { UserHeader, UserTab } from "./components/UserHeader";
import { DidDashboardPage } from "./components/DidDashboardPage";
import { KycVerificationPage } from "./components/KycVerificationPage";
import { AssetInventoryPage } from "./components/AssetInventoryPage";
import { DocumentManagementPage } from "./components/DocumentManagementPage";
import { UserLoginScreen } from "./components/UserLoginScreen";

// Admin components
import { AdminHeader } from "./components/admin/AdminHeader";
import { Sidebar, AdminTab } from "./components/admin/Sidebar";
import { AdminLoginScreen } from "./components/admin/AdminLoginScreen";
import { DashboardOverview } from "./components/admin/DashboardOverview";
import { KycManagementPage } from "./components/admin/KycManagementPage";
import { IssueAssetPage } from "./components/admin/IssueAssetPage";
import { RoleManagementPage } from "./components/admin/RoleManagementPage";
import { AuditLogPage } from "./components/admin/AuditLogPage";

const envUrl =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL;

const isLocalDev =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_URL =
  envUrl ||
  (isLocalDev || (import.meta as any).env?.DEV
    ? "http://localhost:4005/api"
    : "https://ciphertrust-backend.onrender.com/api");

const client = new CipherTrustClient({
  baseUrl: API_URL,
});

export type PortalMode = "admin" | "user";

export const App: React.FC = () => {
  // Determine initial portal mode from URL pathname (e.g. /admin vs /user or /)
  const getInitialMode = (): PortalMode => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith("/admin")) return "admin";
    }
    return "user";
  };

  const [portalMode, setPortalMode] = useState<PortalMode>(getInitialMode);
  const [userSession, setUserSession] = useState<AuthSession | null>(null);
  const [adminSession, setAdminSession] = useState<AuthSession | null>(null);

  // Tab states
  const [userTab, setUserTab] = useState<UserTab>("did");
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");

  // Handle URL changes & sync with browser history
  const navigateTo = (mode: PortalMode) => {
    setPortalMode(mode);
    if (typeof window !== "undefined") {
      const targetPath = mode === "admin" ? "/admin" : "/user";
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ mode }, "", targetPath);
      }
    }
  };

  // Listen to popstate (browser back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const mode: PortalMode = path.startsWith("/admin") ? "admin" : "user";
      setPortalMode(mode);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update URL if user visits root '/' to normalize to current mode
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      window.history.replaceState({ mode: portalMode }, "", portalMode === "admin" ? "/admin" : "/user");
    }
  }, [portalMode]);

  // -------------------------------------------------------------
  // ADMIN PORTAL ROUTE (domain/admin)
  // Requires dedicated admin credentials (email + password + admin wallet)
  // -------------------------------------------------------------
  if (portalMode === "admin") {
    // If admin is not logged in, enforce admin login credentials
    if (!adminSession) {
      return (
        <AdminLoginScreen
          client={client}
          apiUrl={API_URL}
          onLoginSuccess={(session) => {
            setAdminSession(session);
          }}
          onNavigateToUser={() => navigateTo("user")}
        />
      );
    }

    // Authenticated Admin Console View
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
        <AdminHeader
          client={client}
          session={adminSession}
          onSessionChange={setAdminSession}
          onNavigateToUser={() => navigateTo("user")}
        />

        <div className="flex flex-1">
          <Sidebar activeTab={adminTab} setActiveTab={setAdminTab} />

          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
            {adminTab === "dashboard" && <DashboardOverview client={client} />}
            {adminTab === "kyc" && <KycManagementPage client={client} />}
            {adminTab === "issue" && <IssueAssetPage client={client} />}
            {adminTab === "roles" && <RoleManagementPage client={client} />}
            {adminTab === "audit" && <AuditLogPage client={client} />}
          </main>
        </div>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs font-medium text-slate-500">
          <p>
            CipherTrust Admin Management System &copy; 2026. Restricted to authorized platform administrators.
          </p>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // USER PORTAL ROUTE (domain/user or domain/)
  // -------------------------------------------------------------
  if (!userSession) {
    return (
      <UserLoginScreen
        client={client}
        onLoginSuccess={setUserSession}
        onNavigateToAdmin={() => navigateTo("admin")}
      />
    );
  }

  // Authenticated User Portal View
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <UserHeader
        client={client}
        session={userSession}
        onSessionChange={setUserSession}
        userTab={userTab}
        setUserTab={setUserTab}
        onNavigateToAdmin={() => navigateTo("admin")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userTab === "did" && <DidDashboardPage client={client} session={userSession} />}
        {userTab === "kyc" && <KycVerificationPage client={client} session={userSession} />}
        {userTab === "inventory" && (
          <AssetInventoryPage client={client} session={userSession} />
        )}
        {userTab === "documents" && <DocumentManagementPage client={client} session={userSession} />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs font-medium text-slate-500">
        <p>
          CipherTrust Enterprise Identity & Asset Platform &copy; 2026. Powered by OpenZeppelin, Hardhat & W3C DID Standard.
        </p>
      </footer>
    </div>
  );
};

export default App;
