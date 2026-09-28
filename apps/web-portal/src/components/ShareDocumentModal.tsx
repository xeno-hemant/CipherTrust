import React, { useState } from "react";
import { X, Share2, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { DocumentRecord, PermissionType } from "@ciphertrust/shared-types";

interface ShareDocumentModalProps {
  client: CipherTrustClient;
  document: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  client,
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [granteeAddress, setGranteeAddress] = useState("");
  const [permissionType, setPermissionType] = useState<PermissionType>(PermissionType.VIEW);
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!granteeAddress || !granteeAddress.startsWith("0x")) {
      setError("Please enter a valid Ethereum address (0x...)");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await client.shareDocument(document.id, {
        granteeAddress,
        permissionType,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });

      setSuccessMsg("Document access permission granted successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
        setGranteeAddress("");
        setExpiresAt("");
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to grant document access");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Share Document Access</h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[220px]">{document.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Recipient Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Recipient Wallet Address (0x...)
            </label>
            <input
              type="text"
              placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
              value={granteeAddress}
              onChange={(e) => setGranteeAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {/* Permission Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Granted Permission
            </label>
            <select
              value={permissionType}
              onChange={(e) => setPermissionType(e.target.value as PermissionType)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value={PermissionType.VIEW}>VIEW ONLY (Preview metadata & verification)</option>
              <option value={PermissionType.DOWNLOAD}>DOWNLOAD (Full decrypted file download)</option>
              <option value={PermissionType.VERIFY}>VERIFY ONLY (Integrity check access)</option>
            </select>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Access Expiration (Optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Leave empty for non-expiring access until manually revoked.</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 text-[11px] leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              You can revoke this permission at any time from your Document Details panel.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !granteeAddress}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Granting Access...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Grant Access</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
