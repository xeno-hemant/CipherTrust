import React, { useState } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle2, ShieldCheck, Lock } from "lucide-react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { DocumentType } from "@ciphertrust/shared-types";

interface UploadDocumentModalProps {
  client: CipherTrustClient;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  client,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.AADHAAR);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setError("Invalid file type. Supported formats: PDF, JPG, JPEG, PNG.");
        setSelectedFile(null);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError("File size exceeds 15 MB limit.");
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title || selectedFile.name);
      formData.append("description", description);
      formData.append("documentType", documentType);

      await client.uploadDocument(formData);
      setSuccessMsg("Document encrypted & stored securely!");
      setTimeout(() => {
        onSuccess();
        onClose();
        setSelectedFile(null);
        setTitle("");
        setDescription("");
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Secure Document Upload</h3>
              <p className="text-xs text-slate-500 font-medium">AES-256-GCM Off-Chain Encryption</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
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

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Document (PDF, JPG, PNG - Max 15MB)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/30 rounded-xl p-5 text-center transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="w-7 h-7 text-sky-600" />
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Click or drag file to upload</p>
                    <p className="text-[11px] text-slate-400 font-medium">Supported: PDF, JPG, JPEG, PNG</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Document Category
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value={DocumentType.AADHAAR}>Aadhaar / Identity Document</option>
              <option value={DocumentType.MARKSHEET}>Academic Marksheet</option>
              <option value={DocumentType.DEGREE_CERTIFICATE}>Degree Certificate</option>
              <option value={DocumentType.GOVT_CERTIFICATE}>Government-Issued Certificate</option>
              <option value={DocumentType.PROFESSIONAL_CERTIFICATE}>Professional Certificate</option>
              <option value={DocumentType.OTHER}>Other Document</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Document Title
            </label>
            <input
              type="text"
              placeholder="e.g. Aadhaar Card Card Front & Back"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Add optional notes or reference details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex items-start gap-2 text-sky-800 text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <span>
              Your document will be encrypted server-side using <strong>AES-256-GCM</strong>. Only SHA-256 cryptographic hashes will be anchored for integrity. Raw files are never stored on public blockchains.
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
              disabled={isUploading || !selectedFile}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Encrypting & Uploading...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Encrypt & Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
