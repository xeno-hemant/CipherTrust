import React, { useState } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";
import { Header } from "./components/Header";
import { DidDashboardPage } from "./components/DidDashboardPage";
import { AssetInventoryPage } from "./components/AssetInventoryPage";
import { LoginLandingScreen } from "./components/LoginLandingScreen";

const client = new CipherTrustClient({
  baseUrl: "http://localhost:4005/api",
});

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<"did" | "inventory">("did");

  if (!session) {
    return <LoginLandingScreen client={client} onLoginSuccess={setSession} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Header
        client={client}
        session={session}
        onSessionChange={setSession}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "did" ? (
          <DidDashboardPage client={client} session={session} />
        ) : (
          <AssetInventoryPage client={client} session={session} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs font-medium text-slate-500">
        <p>CipherTrust Enterprise Identity & Asset Platform &copy; 2026. Powered by OpenZeppelin, Hardhat & W3C DID Standard.</p>
      </footer>
    </div>
  );
};

export default App;
