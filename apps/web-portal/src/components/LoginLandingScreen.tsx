import React, { useState } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";
import { ShieldCheck, Wallet, ArrowRight, ShieldAlert, Cpu } from "lucide-react";
import { ethers } from "ethers";

interface LoginLandingScreenProps {
  client: CipherTrustClient;
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginLandingScreen: React.FC<LoginLandingScreenProps> = ({ client, onLoginSuccess }) => {
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
      onLoginSuccess(authRes.session);
    } catch (err: any) {
      console.error("Wallet authentication failed:", err);
      setError(err.message || "Failed to authenticate wallet via SIWE");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-fadeIn">
        {/* Logo Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 p-0.5 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-sky-600" />
          </div>
        </div>

        {/* Brand Name */}
        <div>
          <h1 className="text-3xl font-black font-sans tracking-tight">
            <span className="text-slate-900">Cipher</span>
            <span className="text-sky-600">Trust</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Enterprise Verifiable Identity & Access Control Platform
          </p>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-800 font-medium leading-relaxed">
          Authenticate using EIP-4361 Sign-In with Ethereum (SIWE) to access your Decentralized Identity (DID) Document & Digital Asset Inventory.
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => connectAndAuthenticate()}
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold py-3.5 rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Wallet className="w-5 h-5" />
            <span>{loading ? "Authenticating SIWE..." : "Connect Wallet (SIWE Login)"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => connectAndAuthenticate("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")}
            disabled={loading}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
          >
            <Cpu className="w-4 h-4 text-sky-600" />
            <span>Demo Issuer Account Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
