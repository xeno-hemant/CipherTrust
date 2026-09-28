import React, { useState, useEffect } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { KycRecord, KycStatus, ReviewKycRequest } from "@ciphertrust/shared-types";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  RefreshCw,
  ExternalLink,
  User,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
  Filter,
  Eye,
  Check,
  X,
  FileCheck,
  Shield,
  Layers,
} from "lucide-react";

interface KycManagementPageProps {
  client: CipherTrustClient;
}

export const KycManagementPage: React.FC<KycManagementPageProps> = ({ client }) => {
  const [applications, setApplications] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Review State
  const [selectedApp, setSelectedApp] = useState<KycRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.getKycApplications(statusFilter !== "ALL" ? statusFilter : undefined);
      setApplications(data || []);
    } catch (err: any) {
      console.error("Failed to load KYC applications:", err);
      setError(err.message || "Failed to load KYC applications from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleReview = async (status: KycStatus.APPROVED | KycStatus.REJECTED) => {
    if (!selectedApp) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const reviewPayload: ReviewKycRequest = {
        status,
        reviewNotes: reviewNotes.trim() || undefined,
      };

      const updated = await client.reviewKyc(selectedApp.id, reviewPayload);
      setSuccessMsg(
        `Application for ${updated.fullName} was marked as ${updated.status} successfully!`
      );
      setSelectedApp(null);
      setReviewNotes("");
      await fetchApplications();
    } catch (err: any) {
      console.error("Failed to review application:", err);
      setError(err.message || "Failed to submit review decision");
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === KycStatus.PENDING).length;
  const approvedCount = applications.filter((a) => a.status === KycStatus.APPROVED).length;
  const rejectedCount = applications.filter((a) => a.status === KycStatus.REJECTED).length;

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      app.fullName.toLowerCase().includes(q) ||
      app.applicantAddress.toLowerCase().includes(q) ||
      app.idNumber.toLowerCase().includes(q) ||
      app.applicantDid.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            KYC & Compliance Verification Hub
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Review user identity submissions, inspect government IDs, and issue verified DID credentials.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all shadow-sm active:scale-95 self-start sm:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Decision Recorded</p>
            <p className="mt-0.5 text-emerald-700">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Applications</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Review</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Approved Identities</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Rejected</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{rejectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
          {[
            { id: "ALL", label: "All Submissions" },
            { id: "PENDING", label: "Pending Review" },
            { id: "APPROVED", label: "Approved" },
            { id: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, address, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading KYC submissions...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No KYC Applications Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter !== "ALL"
                ? `There are currently no applications with status '${statusFilter}'.`
                : "No users have submitted KYC applications yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Applicant</th>
                  <th className="px-5 py-3.5">Government ID</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{app.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {app.applicantAddress.slice(0, 10)}...{app.applicantAddress.slice(-8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-bold text-slate-700 block">{app.idType}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{app.idNumber}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>
                        <span>{app.phone || "—"}</span>
                        {app.email && (
                          <span className="block text-[10px] text-slate-400">{app.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {app.status === KycStatus.APPROVED && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>APPROVED</span>
                        </span>
                      )}
                      {app.status === KycStatus.PENDING && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>PENDING</span>
                        </span>
                      )}
                      {app.status === KycStatus.REJECTED && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" />
                          <span>REJECTED</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setReviewNotes(app.reviewNotes || "");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl transition-all border border-sky-200 shadow-sm active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Attestation Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    KYC Application Review
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedApp.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Legal Name</span>
                <p className="font-bold text-slate-900 text-sm">{selectedApp.fullName}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">ID Document Type</span>
                <p className="font-bold text-slate-900 text-sm">{selectedApp.idType}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Government ID Number</span>
                <p className="font-mono font-bold text-slate-900">{selectedApp.idNumber}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Nationality</span>
                <p className="font-bold text-slate-900">{selectedApp.nationality || "India"}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">Applicant DID & Address</span>
                <p className="font-mono text-slate-700 break-all">{selectedApp.applicantDid}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Phone Number</span>
                <p className="font-bold text-slate-900">{selectedApp.phone || "—"}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Email Address</span>
                <p className="font-bold text-slate-900">{selectedApp.email || "—"}</p>
              </div>
            </div>

            {/* Document Scans & Photo Preview */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Uploaded Verifiable Proofs
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ID Document Preview */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    ID Document Scan
                  </span>
                  {selectedApp.documentData && selectedApp.documentData.startsWith("data:image") ? (
                    <img
                      src={selectedApp.documentData}
                      alt="ID Scan"
                      className="w-full h-36 object-contain rounded-xl bg-white border border-slate-200"
                    />
                  ) : (
                    <div className="w-full h-36 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-2">
                      <FileText className="w-8 h-8 text-sky-600 mb-1" />
                      <span className="text-xs font-bold text-slate-700 text-center truncate max-w-full">
                        {selectedApp.documentFilename || "Government ID Document"}
                      </span>
                      <span className="text-[10px] text-slate-400">Uploaded Document Record</span>
                    </div>
                  )}
                </div>

                {/* Facial Selfie Preview */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Facial Verification Selfie
                  </span>
                  {selectedApp.selfieData && selectedApp.selfieData.startsWith("data:image") ? (
                    <img
                      src={selectedApp.selfieData}
                      alt="Selfie"
                      className="w-full h-36 object-contain rounded-xl bg-white border border-slate-200"
                    />
                  ) : (
                    <div className="w-full h-36 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-2">
                      <User className="w-8 h-8 text-indigo-600 mb-1" />
                      <span className="text-xs font-bold text-slate-700">Selfie Snapshot</span>
                      <span className="text-[10px] text-slate-400">Biometric Live Verification</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Compliance Reviewer Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Compliance Reviewer Notes / Attestation Justification
              </label>
              <textarea
                rows={3}
                placeholder="Enter verification notes or reason for approval/rejection (e.g., 'Verified against UIDAI database - identity valid')..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50/50"
              />
            </div>

            {/* Decision Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Close
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleReview(KycStatus.REJECTED)}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Reject KYC</span>
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleReview(KycStatus.APPROVED)}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Approve Identity (Tier 1 Verified)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
