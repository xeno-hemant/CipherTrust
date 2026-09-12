import React, { useState } from "react";
import { ethers } from "ethers";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";
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

  const connectAndAuthenticate = async (targetAddress?: string) => {
    setLoading(true);
    setError(null);
    try {
      let address = targetAddress;
      let signer: ethers.Signer | null = null;

      if (!address && typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        address = await signer.getAddress();
      }

      if (!address) {
        address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Issuer demo wallet
      }

      const { nonce } = await client.getNonce(address);
      const domain = window.location.host;
      const origin = window.location.origin;
      const statement = "Sign in to CipherTrust Decentralized Identity Portal";
      const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${origin}\nVersion: 1\nChain ID: 31337\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;

      let signature = "0x" + "1".repeat(130);
      if (signer) {
        signature = await signer.signMessage(message);
      }

      const authRes = await client.verifySiwe(message, signature);
      onSessionChange(authRes.session);
    } catch (err: any) {
      console.error("Wallet authentication failed:", err);
      setError(err.message || "Failed to authenticate wallet");
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
      <div className="flex items-center gap-2">
        <button
          onClick={() => connectAndAuthenticate()}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <Wallet className="w-4 h-4" />
          <span>{loading ? "Authenticating..." : "Connect Wallet"}</span>
        </button>

        <button
          onClick={() => connectAndAuthenticate("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")}
          disabled={loading}
          title="Connect Demo Account"
          className="text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2.5 rounded-xl shadow-sm transition-all"
        >
          Demo Login
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs text-rose-600 mt-1">
          <ShieldAlert className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
