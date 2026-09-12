import React, { useState } from "react";
import { NFTAsset } from "@ciphertrust/shared-types";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { X, Send, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface TransferAssetModalProps {
  client: CipherTrustClient;
  asset: NFTAsset | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferAssetModal: React.FC<TransferAssetModalProps> = ({
  client,
  asset,
  onClose,
  onSuccess,
}) => {
  const [recipient, setRecipient] = useState("0x3C44CdD45913C54E43525531E03c981708277271");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!asset) return null;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await client.transferNft({
        tokenId: asset.tokenId,
        contractAddress: asset.contractAddress,
        recipientAddress: recipient,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to transfer asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-extrabold text-slate-900">Transfer Asset</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center gap-3">
            <img
              src={asset.metadata?.image || "https://picsum.photos/400/400"}
              alt={asset.metadata?.name}
              className="w-12 h-12 rounded-xl object-cover border border-sky-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80";
              }}
            />
            <div>
              <span className="font-extrabold text-sm text-slate-900 block truncate">{asset.metadata?.name}</span>
              <span className="text-xs font-mono font-bold text-sky-700">Token ID: #{asset.tokenId}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Recipient Wallet Address or DID *
            </label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x... or did:ethr:31337:0x..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-sky-700 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Asset transferred successfully!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold py-3 rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Transfer...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm Transfer</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
