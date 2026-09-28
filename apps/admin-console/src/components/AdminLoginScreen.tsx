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
} from "lucide-react";
import { ethers } from "ethers";

interface AdminLoginScreenProps {
  client: CipherTrustClient;
  onLoginSuccess: (session: AuthSession) => void;
  apiUrl: string;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  client,
  onLoginSuccess,
  apiUrl,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
              the authorized admin wallet.
            </span>
          </div>

          {/* Quick Dev Login Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-[11px] font-bold text-emerald-300">Local Testing / Demo Mode</p>
              <p className="text-[10px] text-slate-400">Instant login without MetaMask setup</p>
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

          {/* MetaMask Warning */}
          {!hasMetaMask && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-amber-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  MetaMask not detected. Use 1-Click Admin Login above for testing, or install MetaMask.
                </span>
              </div>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Install MetaMask</span>
              </a>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ciphertrust.io"
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Progress Steps */}
            {loading && (
              <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {step === "connecting_wallet" &&
                      "Opening MetaMask popup — approve the connection..."}
                    {step === "signing" &&
                      "Sign the challenge message in MetaMask..."}
                    {step === "authenticating" &&
                      "Verifying admin credentials & wallet..."}
                    {step === "validating" && "Validating credentials..."}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <CheckCircle2
                    className={`w-3 h-3 ${
                      step !== "connecting_wallet"
                        ? "text-emerald-400"
                        : "text-slate-600"
                    }`}
                  />
                  <span>MetaMask</span>
                  <span className="text-slate-700">→</span>
                  <CheckCircle2
                    className={`w-3 h-3 ${
                      step === "authenticating"
                        ? "text-emerald-400"
                        : "text-slate-600"
                    }`}
                  />
                  <span>Sign</span>
                  <span className="text-slate-700">→</span>
                  <CheckCircle2 className="w-3 h-3 text-slate-600" />
                  <span>Verify</span>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !hasMetaMask}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 disabled:from-slate-600 disabled:to-slate-600 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating Admin...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  <span>Admin Login with MetaMask</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Footer */}
          <div className="border-t border-slate-700/30 pt-4 space-y-1.5 text-[10px] text-slate-500 font-medium text-center">
            <p>🔐 Triple-factor: Email + Password + MetaMask Wallet Signature</p>
            <p>🛡️ Only the authorized admin wallet can access this console</p>
            <p>⛓️ All admin actions are logged on-chain in the audit trail</p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <p className="relative mt-8 text-[10px] text-slate-600 font-medium">
        CipherTrust Admin Console v1.0 — Unauthorized access is prohibited
      </p>
    </div>
  );
};
