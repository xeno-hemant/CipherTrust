import React, { useState } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession } from "@ciphertrust/shared-types";
import {
  ShieldCheck,
  Wallet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Shield,
  KeyRound,
  UserCheck,
} from "lucide-react";
import { ethers } from "ethers";

interface AdminLoginScreenProps {
  client: CipherTrustClient;
  onLoginSuccess: (session: AuthSession) => void;
  apiUrl: string;
  onNavigateToUser?: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  client,
  onLoginSuccess,
  apiUrl,
  onNavigateToUser,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "validating" | "connecting_wallet" | "signing" | "authenticating"
  >("idle");

  const hasMetaMask =
    typeof window !== "undefined" && !!(window as any).ethereum;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!email.trim()) {
      setError("Admin email address is required");
      return;
    }
    if (!password.trim()) {
      setError("Admin password is required");
      return;
    }

    // Check MetaMask
    if (!hasMetaMask) {
      setError(
        "MetaMask is not installed. Admin login requires MetaMask wallet verification."
      );
      return;
    }

    setLoading(true);
    setStep("connecting_wallet");

    try {
      // Step 1: Connect MetaMask — triggers popup
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (!accounts || accounts.length === 0) {
        throw new Error("No MetaMask accounts found. Please unlock your wallet.");
      }

      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      setStep("signing");

      // Step 2: Create and sign challenge message via MetaMask
      const challengeMessage = `CipherTrust Admin Authentication\n\nEmail: ${email}\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`;

      const signature = await signer.signMessage(challengeMessage);

      setStep("authenticating");

      // Step 3: Send credentials + wallet info to backend for verification
      const response = await fetch(`${apiUrl}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          walletAddress,
          signature,
          message: challengeMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Admin authentication failed");
      }

      // Store auth token for API calls
      if (data.token) {
        client.setAuthToken(data.token);
      }

      onLoginSuccess(data.session);
    } catch (err: any) {
      console.error("Admin login error:", err);

      if (err.code === 4001) {
        setError(
          "MetaMask connection rejected. Please approve the popup to authenticate as admin."
        );
      } else if (err.code === -32002) {
        setError(
          "MetaMask is already processing a request. Check your MetaMask extension."
        );
      } else {
        setError(err.message || "Admin authentication failed");
      }
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setError(null);
    setStep("authenticating");

    try {
      // In local dev/mock mode, use the default deployer wallet to sign challenge
      const devWallet = new ethers.Wallet(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      );
      const adminEmail = "admin@ciphertrust.io";
      const adminPass = "CipherTrust@Admin2026#Secure";
      const walletAddress = devWallet.address;

      const challengeMessage = `CipherTrust Admin Authentication\n\nEmail: ${adminEmail}\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`;
      const signature = await devWallet.signMessage(challengeMessage);

      const response = await fetch(`${apiUrl}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPass,
          walletAddress,
          signature,
          message: challengeMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Admin authentication failed");
      }

      if (data.token) {
        client.setAuthToken(data.token);
      }

      onLoginSuccess(data.session);
    } catch (err: any) {
      console.error("Dev admin login error:", err);
      setError(err.message || "Local dev admin authentication failed");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative max-w-md w-full space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 p-0.5 flex items-center justify-center mx-auto shadow-xl shadow-sky-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 text-sky-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              <span className="text-white">Cipher</span>
              <span className="text-sky-400">Trust</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                ADMIN CONSOLE
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                RESTRICTED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Authentication required to manage platform contracts, assets, roles, and compliance.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Security Notice */}
          <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-3 flex items-start gap-2 text-[11px] text-sky-300 font-medium leading-relaxed">
            <KeyRound className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <span>
              Admin access requires <strong>email + password</strong>{" "}
              verification AND <strong>MetaMask wallet</strong> signature from
              the authorized platform admin wallet.
            </span>
          </div>

          {/* Quick Dev Login Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-[11px] font-bold text-emerald-300">Testing / Demo Mode</p>
              <p className="text-[10px] text-slate-400">Instant admin credentials verification</p>
            </div>
            <button
              type="button"
              onClick={handleDevLogin}
              disabled={loading}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              ⚡ 1-Click Admin Login
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 font-medium">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Progress Steps */}
          {loading && (
            <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span>
                  {step === "connecting_wallet" &&
                    "Opening MetaMask for wallet verification..."}
                  {step === "signing" &&
                    "Waiting for admin signature in MetaMask..."}
                  {step === "authenticating" &&
                    "Verifying credentials against backend..."}
                </span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Admin Email Address</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@ciphertrust.io");
                    setPassword("CipherTrust@Admin2026#Secure");
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-medium"
                >
                  Fill Default
                </button>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ciphertrust.io"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* MetaMask Required Info */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-900/40 rounded-xl border border-slate-700/50 text-[11px] text-slate-400">
              <Wallet className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Authorized Admin Wallet:{" "}
                <code className="text-sky-300 font-mono text-[10px]">
                  0xf39F...2266
                </code>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Admin...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Credentials & Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to User Portal */}
          <div className="pt-3 border-t border-slate-700/60 text-center">
            <button
              type="button"
              onClick={onNavigateToUser}
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Go to User Portal (domain/user)</span>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[10px] text-slate-500 space-y-1">
          <p>
            🔒 All admin activities are cryptographically signed & recorded to
            the immutable on-chain audit ledger.
          </p>
        </div>
      </div>
    </div>
  );
};
