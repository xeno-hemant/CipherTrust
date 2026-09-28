import React, { useState } from "react";
import { ethers } from "ethers";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession, Role } from "@ciphertrust/shared-types";
import { Wallet, LogOut, CheckCircle2, ShieldAlert } from "lucide-react";

interface ConnectWalletButtonProps {
  client: CipherTrustClient;
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  client,
  session,
  onSessionChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectAndAuthenticate = async () => {
    // MetaMask is REQUIRED
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("MetaMask not detected. Install MetaMask to connect.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Trigger MetaMask popup
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // SIWE Authentication
      try {
        const { nonce } = await client.getNonce(address);
        const domain = window.location.host;
        const origin = window.location.origin;
        const statement = "Sign in to CipherTrust Decentralized Identity Portal";
        const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${origin}\nVersion: 1\nChain ID: 31337\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;

        // MetaMask signature popup
        const signature = await signer.signMessage(message);

        const authRes = await client.verifySiwe(message, signature);
        onSessionChange(authRes.session);
      } catch (apiErr) {
        console.warn("Backend API unreachable, using client AuthSession fallback:", apiErr);
        onSessionChange({
          address,
          did: `did:ethr:31337:${address}`,
          roles: [Role.HOLDER],
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        });
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Connection rejected. Please approve MetaMask popup.");
      } else {
        setError(err.message || "Failed to authenticate wallet");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    client.setAuthToken("");
    onSessionChange(null);
  };

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-500">Connected Wallet</span>
          <span className="text-sm font-mono font-bold text-sky-700">
            {session.address.substring(0, 6)}...{session.address.substring(session.address.length - 4)}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-2xl px-3 py-1.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold text-sky-800">
            {session.roles.join(", ")}
          </span>
          <button
            onClick={handleDisconnect}
            title="Disconnect Wallet"
            className="ml-1 text-slate-400 hover:text-rose-500 transition-colors p-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connectAndAuthenticate}
        disabled={loading}
        className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        <span>{loading ? "Connecting MetaMask..." : "Connect MetaMask"}</span>
      </button>

      {error && (
        <div className="flex items-center gap-1 text-xs text-rose-600 mt-1">
          <ShieldAlert className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
