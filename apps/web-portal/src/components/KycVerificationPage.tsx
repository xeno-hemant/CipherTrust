import React, { useState, useEffect } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession, KycRecord, KycStatus, SubmitKycRequest } from "@ciphertrust/shared-types";
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  User,
  Calendar,
  Globe,
  CreditCard,
  Phone,
  Mail,
  RefreshCw,
  Camera,
  Lock,
  ArrowRight,
  ExternalLink,
  Download,
  AlertTriangle,
  Loader2,
  FileCheck2,
} from "lucide-react";

interface KycVerificationPageProps {
  client: CipherTrustClient;
  session: AuthSession;
}

export const KycVerificationPage: React.FC<KycVerificationPageProps> = ({
  client,
  session,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [kycData, setKycData] = useState<KycRecord | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("India");
  const [idType, setIdType] = useState("AADHAAR");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [documentFilename, setDocumentFilename] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<string | null>(null);
  const [selfieData, setSelfieData] = useState<string | null>(null);

  const fetchKycStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await client.getKycStatus();
      if ("id" in res) {
        setKycData(res as KycRecord);
      } else {
        setKycData(null);
      }
    } catch (err: any) {
      console.error("Failed to load KYC status:", err);
      // In offline/mock fallback, don't crash
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, [session.address]);

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocumentFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setDocumentData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelfieData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setError("Full legal name is required as per government ID");
      return;
    }
    if (!idNumber.trim()) {
      setError("Government ID number is required");
      return;
    }
    if (!phone.trim()) {
      setError("Mobile phone number is required for identity verification");
      return;
    }

    setSubmitting(true);

    try {
      const payload: SubmitKycRequest = {
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth || undefined,
        nationality,
        idType,
        idNumber: idNumber.trim(),
        documentFilename: documentFilename || `${idType.toLowerCase()}_scan.pdf`,
        documentData: documentData || undefined,
        selfieData: selfieData || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
      };

      const result = await client.submitKyc(payload);
      setKycData(result);
      setIsResubmitting(false);
      setSuccessMsg("KYC verification application submitted successfully! It is now pending compliance review.");
    } catch (err: any) {
      console.error("KYC submission error:", err);
      setError(err.message || "Failed to submit KYC application. Please check backend connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const getMaskedIdNumber = (num: string) => {
    if (!num) return "";
    if (num.length <= 4) return num;
    return "•".repeat(num.length - 4) + num.slice(-4);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Checking KYC Verification Status...</p>
      </div>
    );
  }

  const showForm = !kycData || isResubmitting;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                W3C DID COMPLIANCE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {session.did.slice(0, 24)}...
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Know Your Customer (KYC) Verification
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Verify your Decentralized Identity with official government documentation. Verified profiles gain access to high-value verifiable asset minting, official credential sharing, and compliant tokenized assets.
            </p>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={fetchKycStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold transition-all text-white active:scale-95 self-start md:self-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Verification Error</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Submission Confirmed</p>
            <p className="mt-0.5 text-emerald-700">{successMsg}</p>
          </div>
        </div>
      )}

      {/* STATUS DISPLAY (If user already submitted) */}
      {!showForm && kycData && (
        <div className="space-y-6">
          {/* Status Badge & Banner */}
          {kycData.status === KycStatus.APPROVED && (
            <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/80 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900">
                        Identity Verified (Tier 1)
                      </h3>
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold uppercase rounded-full">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      Your identity has been verified and cryptographically stamped on-chain.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Verified On
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {kycData.reviewedAt ? new Date(kycData.reviewedAt).toLocaleDateString() : "Active"}
                  </span>
                </div>
              </div>

              {/* Verified Profile Credential Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Legal Name</span>
                  <p className="text-sm font-black text-slate-800">{kycData.fullName}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">ID Document Type</span>
                  <p className="text-sm font-black text-slate-800">{kycData.idType}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Masked ID Number</span>
                  <p className="text-sm font-mono font-bold text-slate-800">{getMaskedIdNumber(kycData.idNumber)}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Verified DID</span>
                  <p className="text-xs font-mono text-slate-600 truncate">{kycData.applicantDid}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Compliance Authority</span>
                  <p className="text-xs font-mono text-slate-600 truncate">{kycData.reviewedBy || "CipherTrust Compliance Admin"}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Attestation Ref</span>
                  <p className="text-xs font-mono text-slate-600 truncate">{kycData.id.slice(0, 18)}...</p>
                </div>
              </div>

              {kycData.reviewNotes && (
                <div className="mt-6 p-4 bg-emerald-100/60 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                  <p className="font-bold">Compliance Attestation Notes:</p>
                  <p className="mt-1">{kycData.reviewNotes}</p>
                </div>
              )}
            </div>
          )}

          {kycData.status === KycStatus.PENDING && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                    <Clock className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Application Under Compliance Review
                    </h3>
                    <p className="text-xs text-amber-900 font-medium mt-0.5">
                      Your documents are being reviewed by authorized CipherTrust Compliance Officers.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-amber-200 text-amber-900 font-extrabold text-xs rounded-full uppercase self-start sm:self-auto">
                  PENDING REVIEW
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Applicant</span>
                  <span className="font-bold text-slate-800">{kycData.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Document Type</span>
                  <span className="font-bold text-slate-800">{kycData.idType}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">ID Number</span>
                  <span className="font-mono font-bold text-slate-800">{getMaskedIdNumber(kycData.idNumber)}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Submitted On</span>
                  <span className="font-bold text-slate-800">{new Date(kycData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  Average approval time: <strong>1 to 24 hours</strong>. You can check back here anytime.
                </p>
                <button
                  type="button"
                  onClick={fetchKycStatus}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Check Latest Status
                </button>
              </div>
            </div>
          )}

          {kycData.status === KycStatus.REJECTED && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      KYC Verification Not Approved
                    </h3>
                    <p className="text-xs text-rose-800 font-medium mt-0.5">
                      Your submitted documents could not be verified by compliance.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-rose-200 text-rose-900 font-extrabold text-xs rounded-full uppercase self-start sm:self-auto">
                  REJECTED
                </span>
              </div>

              {kycData.reviewNotes && (
                <div className="bg-white p-4 rounded-2xl border border-rose-200 text-xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-rose-600 block">
                    Reason for Rejection from Compliance Officer:
                  </span>
                  <p className="text-slate-800 font-medium">{kycData.reviewNotes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  You may re-submit with updated, clear documentation at any time.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFullName(kycData.fullName);
                    setIdType(kycData.idType);
                    setIdNumber(kycData.idNumber);
                    setPhone(kycData.phone || "");
                    setEmail(kycData.email || "");
                    setIsResubmitting(true);
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  Re-Apply for KYC
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KYC SUBMISSION FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isResubmitting ? "Re-apply for Identity Verification" : "Identity Application Form"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Please provide accurate information matching your government-issued identity documents.
              </p>
            </div>
            {isResubmitting && (
              <button
                type="button"
                onClick={() => setIsResubmitting(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
              >
                Cancel Re-application
              </button>
            )}
          </div>

          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <User className="w-4 h-4 text-sky-600" />
              <span>1. Legal Personal Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-bold text-slate-700">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nationality / Country</label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50/50"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Singapore">Singapore</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Germany">Germany</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Government ID Specification */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <span>2. Government Identification Document</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Document Type *</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50/50"
                >
                  <option value="AADHAAR">Aadhaar Card (UIDAI)</option>
                  <option value="PAN">PAN Card (Income Tax Dept)</option>
                  <option value="PASSPORT">Passport (Republic of India / Global)</option>
                  <option value="DRIVING_LICENSE">Driving License (RTO)</option>
                  <option value="VOTER_ID">Voter Identity Card (ECI)</option>
                  <option value="NATIONAL_ID">National ID Card</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Document ID / Number *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    idType === "AADHAAR"
                      ? "XXXX-XXXX-XXXX (12 digits)"
                      : idType === "PAN"
                      ? "ABCDE1234F (10 characters)"
                      : "Official Document Number"
                  }
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50/50 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Document Upload & Selfie */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <Upload className="w-4 h-4 text-sky-600" />
              <span>3. Document Proof & Biometric Selfie Verification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Document Scan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Upload ID Card / Document Scan</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, PDF (Max 10MB)</span>
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50/40 relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleDocumentUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1.5 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {documentFilename || "Click to browse or drop document scan"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Ensure text, photo, and government seal are clearly legible
                    </p>
                  </div>
                </div>
              </div>

              {/* Selfie / Photo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Live Facial Photo / Selfie</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG</span>
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50/40 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelfieUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1.5 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {selfieData ? "Selfie photo selected ✓" : "Upload front-facing live photo"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Direct eye contact, neutral background, no sunglasses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Contact Information */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <Phone className="w-4 h-4 text-sky-600" />
              <span>4. Contact Verification Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mobile Phone Number *</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address (Optional)</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Cryptographic Guarantee Notice */}
          <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-sky-900 leading-relaxed">
            <Lock className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Cryptographic Privacy Guarantee</p>
              <p className="text-[11px] text-sky-800 mt-0.5">
                Your sensitive personal credentials and document scans are encrypted using <strong>AES-256-GCM envelope encryption</strong>. Only authorized compliance verifiers can review your records. Identity hashes are anchored immutably to W3C Decentralized Identity specifications.
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit KYC Verification Application</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
