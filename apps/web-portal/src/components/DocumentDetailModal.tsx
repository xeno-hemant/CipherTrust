import React, { useState, useEffect } from "react";
import {
  X,
  FileCheck,
  ShieldCheck,
  Lock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Key,
  History,
  Trash2,
  RefreshCw,
  Download,
  Share2,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import {
  DocumentRecord,
  DocumentAccessRecord,
  DocumentAuditEventRecord,
  VerificationStatus,
  AuthSession,
  Role,
} from "@ciphertrust/shared-types";

interface DocumentDetailModalProps {
  client: CipherTrustClient;
  session: AuthSession;
  document: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onOpenShareModal: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  client,
  session,
  document,
  isOpen,
  onClose,
  onRefresh,
  onOpenShareModal,
}) => {
  const [details, setDetails] = useState<DocumentRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<DocumentAuditEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<{
    match: boolean;
    storedHash: string;
    calculatedHash: string;
  } | null>(null);
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [isAttesting, setIsAttesting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isIssuerOrAdmin = session.roles.includes(Role.ADMIN) || session.roles.includes(Role.ISSUER);

  useEffect(() => {
    if (isOpen && document) {
      loadDocumentDetails();
    }
  }, [isOpen, document?.id]);

  const loadDocumentDetails = async () => {
    if (!document) return;
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await client.getDocumentDetails(document.id);
      setDetails(data);
      const logs = await client.getDocumentAuditHistory(document.id);
      setAuditLogs(logs);
    } catch (err: any) {
      setActionError(err.message || "Failed to load document details");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !document) return null;

  const handleVerifyIntegrity = async () => {
    setIsVerifyingIntegrity(true);
    setActionError(null);
    try {
      const result = await client.verifyDocumentIntegrity(document.id);
      setIntegrityResult(result);
      setActionSuccess("Cryptographic SHA-256 hash verified against stored record!");
    } catch (err: any) {
      setActionError(err.message || "Integrity verification failed");
    } finally {
      setIsVerifyingIntegrity(false);
    }
  };

  const handleIssuerAttestation = async (resultStatus: VerificationStatus) => {
    setIsAttesting(true);
    setActionError(null);
    try {
      await client.verifyDocumentIssuer(document.id, {
        verificationResult: resultStatus,
        notes: `Attested by ${session.address} on ${new Date().toLocaleDateString()}`,
      });
      setActionSuccess(`Document verification status updated to ${resultStatus}!`);
      loadDocumentDetails();
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to attest document status");
    } finally {
      setIsAttesting(false);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    try {
      await client.revokeDocumentAccess(document.id, accessId);
      setActionSuccess("Access permission revoked successfully.");
      loadDocumentDetails();
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to revoke access");
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await client.downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.originalFilename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionError(err.message || "Download failed");
    }
  };

  const currentDoc = details || document;
  const isOwner = currentDoc.ownerAddress?.toLowerCase() === session.address.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <FileCheck className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">{currentDoc.title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                  {currentDoc.documentType}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">{currentDoc.originalFilename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {actionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Quick Action Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  currentDoc.verificationStatus === VerificationStatus.VERIFIED
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                {currentDoc.verificationStatus}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {(currentDoc.fileSize / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  onClick={onOpenShareModal}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>Share</span>
                </button>
              )}

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Decrypted File</span>
              </button>
            </div>
          </div>

          {/* Cryptographic SHA-256 Integrity Verification Section */}
          <div className="border border-sky-200 bg-sky-50/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-600" />
                <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">
                  Cryptographic File Integrity
                </h4>
              </div>
              <button
                onClick={handleVerifyIntegrity}
                disabled={isVerifyingIntegrity}
                className="px-3 py-1 bg-sky-600 text-white hover:bg-sky-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingIntegrity ? "animate-spin" : ""}`} />
                <span>Verify Hash Integrity</span>
              </button>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono break-all text-slate-700">
              <span className="text-slate-400 font-bold block text-[10px] uppercase font-sans mb-0.5">
                Stored SHA-256 Hash
              </span>
              {currentDoc.documentHash}
            </div>

            {integrityResult && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  integrityResult.match
                    ? "bg-emerald-100 border border-emerald-200 text-emerald-800"
                    : "bg-rose-100 border border-rose-200 text-rose-800"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  SHA-256 Match Confirmed! Current file content perfectly matches stored hash.
                </span>
              </div>
            )}
          </div>

          {/* Issuer Attestation Section (For Issuer / Admin) */}
          {isIssuerOrAdmin && (
            <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">
                  Issuer Attestation Controls (Admin / Issuer)
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Formally verify or reject this user-submitted document identity record.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleIssuerAttestation(VerificationStatus.VERIFIED)}
                  disabled={isAttesting}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Mark as ISSUER VERIFIED
                </button>
                <button
                  onClick={() => handleIssuerAttestation(VerificationStatus.REJECTED)}
                  disabled={isAttesting}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Mark as REJECTED
                </button>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Owner Address</span>
              <span className="font-mono font-bold text-slate-800 truncate block">{currentDoc.ownerAddress}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Encryption Version</span>
              <span className="font-bold text-slate-800 block">{currentDoc.encryptionVersion || "AES-256-GCM-v1"}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Created Timestamp</span>
              <span className="font-bold text-slate-800 block">{new Date(currentDoc.createdAt).toLocaleString()}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Off-Chain Storage Storage Key</span>
              <span className="font-mono font-bold text-slate-800 truncate block">{currentDoc.encryptedStorageKey}</span>
            </div>
          </div>

          {/* Active Access Permissions */}
          {isOwner && currentDoc.accessList && (
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">
                Active Sharing Permissions ({currentDoc.accessList.length})
              </h4>
              {currentDoc.accessList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No external sharing permissions granted yet.</p>
              ) : (
                <div className="space-y-2">
                  {currentDoc.accessList.map((access: DocumentAccessRecord) => (
                    <div
                      key={access.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-mono font-bold text-slate-800">{access.granteeAddress}</p>
                        <p className="text-[10px] text-slate-500">
                          Permission: <strong className="text-sky-700">{access.permissionType}</strong> | Granted:{" "}
                          {new Date(access.grantedAt).toLocaleDateString()}
                          {access.expiresAt && ` | Expires: ${new Date(access.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      {access.status === "ACTIVE" && (
                        <button
                          onClick={() => handleRevokeAccess(access.id)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">Audit Trail Timeline</h4>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No audit records logged yet.</p>
            ) : (
              <div className="space-y-2 border-l-2 border-sky-200 pl-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative text-xs space-y-0.5">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 uppercase text-[11px]">{log.actionType}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">Actor: <span className="font-mono font-medium">{log.actorAddress}</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
