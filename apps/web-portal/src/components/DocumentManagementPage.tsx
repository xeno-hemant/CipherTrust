import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Search,
  Filter,
  ShieldCheck,
  Lock,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
  FileCheck,
  Users,
  Shield,
  Layers,
  Key,
} from "lucide-react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import {
  AuthSession,
  DocumentRecord,
  DocumentType,
  VerificationStatus,
} from "@ciphertrust/shared-types";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { ShareDocumentModal } from "./ShareDocumentModal";
import { DocumentDetailModal } from "./DocumentDetailModal";

interface DocumentManagementPageProps {
  client: CipherTrustClient;
  session: AuthSession;
}

export const DocumentManagementPage: React.FC<DocumentManagementPageProps> = ({
  client,
  session,
}) => {
  const [activeTab, setActiveTab] = useState<"my" | "shared">("my");
  const [myDocuments, setMyDocuments] = useState<DocumentRecord[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState<DocumentRecord | null>(null);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DocumentRecord | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [activeTab]);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "my") {
        const docs = await client.getMyDocuments();
        setMyDocuments(docs);
      } else {
        const shared = await client.getSharedDocuments();
        setSharedDocuments(shared);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document? The off-chain file will be removed.")) {
      return;
    }
    try {
      await client.deleteDocument(id);
      loadDocuments();
    } catch (err: any) {
      alert(err.message || "Failed to delete document");
    }
  };

  const handleDownloadFile = async (doc: DocumentRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = await client.downloadDocument(doc.id);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.originalFilename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download file");
    }
  };

  const docsToDisplay = activeTab === "my" ? myDocuments : sharedDocuments;

  const filteredDocs = docsToDisplay.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentHash.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || doc.documentType === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalMyDocs = myDocuments.length;
  const verifiedCount = myDocuments.filter((d) => d.verificationStatus === VerificationStatus.VERIFIED).length;
  const totalShared = sharedDocuments.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3 text-sky-400" />
                AES-256-GCM Encrypted Storage
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Off-Chain Privacy Preserved
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Secure Document Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Upload, encrypt, and share Aadhaar identity records, marksheets, and degree certificates. Cryptographic hashes remain verifiable while private files stay strictly off-chain.
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2 flex-shrink-0 self-start md:self-auto"
          >
            <Upload className="w-4 h-4 text-slate-950" />
            <span>Upload New Document</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Documents</p>
            <h3 className="text-2xl font-black text-slate-900">{totalMyDocs}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issuer Verified</p>
            <h3 className="text-2xl font-black text-slate-900">{verifiedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shared With Me</p>
            <h3 className="text-2xl font-black text-slate-900">{totalShared}</h3>
          </div>
        </div>
      </div>

      {/* Main Tabs & Search / Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === "my"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Encrypted Documents ({myDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                activeTab === "shared"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Shared With Me ({sharedDocuments.length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, filename, or hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Categories</option>
              <option value={DocumentType.AADHAAR}>Aadhaar</option>
              <option value={DocumentType.MARKSHEET}>Marksheet</option>
              <option value={DocumentType.DEGREE_CERTIFICATE}>Degree</option>
              <option value={DocumentType.GOVT_CERTIFICATE}>Govt Cert</option>
              <option value={DocumentType.PROFESSIONAL_CERTIFICATE}>Professional</option>
              <option value={DocumentType.OTHER}>Other</option>
            </select>
          </div>
        </div>

        {/* Loading / Error / Empty States */}
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading document vault...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No documents found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === "my"
                ? "Upload your Aadhaar, degree certificates, or marksheets to encrypt and manage them securely."
                : "No shared documents have been granted to your wallet address."}
            </p>
          </div>
        ) : (
          /* Document Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredDocs.map((doc: DocumentRecord) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocForDetail(doc)}
                className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                      {doc.documentType}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        doc.verificationStatus === VerificationStatus.VERIFIED
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {doc.verificationStatus}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono truncate">{doc.originalFilename}</p>
                </div>

                {/* Metadata info */}
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>File Size: {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      SHA256: {doc.documentHash.substring(0, 16)}...
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Encrypted Off-Chain (AES-256-GCM)</span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDownloadFile(doc, e)}
                      title="Download Decrypted File"
                      className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {activeTab === "my" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocForShare(doc);
                        }}
                        title="Share Document"
                        className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDocForDetail(doc)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                    >
                      Details
                    </button>

                    {activeTab === "my" && (
                      <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        title="Delete Document"
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        client={client}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadDocuments}
      />

      {/* Share Document Modal */}
      <ShareDocumentModal
        client={client}
        document={selectedDocForShare}
        isOpen={!!selectedDocForShare}
        onClose={() => setSelectedDocForShare(null)}
        onSuccess={loadDocuments}
      />

      {/* Document Detail & Audit Modal */}
      <DocumentDetailModal
        client={client}
        session={session}
        document={selectedDocForDetail}
        isOpen={!!selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
        onRefresh={loadDocuments}
        onOpenShareModal={() => {
          setSelectedDocForShare(selectedDocForDetail);
          setSelectedDocForDetail(null);
        }}
      />
    </div>
  );
};
