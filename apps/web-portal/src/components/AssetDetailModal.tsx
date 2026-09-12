import React from "react";
import { NFTAsset } from "@ciphertrust/shared-types";
import { X, ExternalLink, ShieldCheck, Tag, Calendar, User, Copy, Check } from "lucide-react";

interface AssetDetailModalProps {
  asset: NFTAsset | null;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!asset) return null;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-extrabold px-2.5 py-1 rounded-lg">
              Token ID #{asset.tokenId}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Verifiable Asset</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Image & Title Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative group">
              <img
                src={asset.metadata?.image || "https://picsum.photos/400/400"}
                alt={asset.metadata?.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80";
                }}
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 font-sans">{asset.metadata?.name}</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{asset.metadata?.description}</p>
              
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md font-mono">
                  {asset.contractAddress.substring(0, 10)}...
                </span>
              </div>
            </div>
          </div>

          {/* Attributes Grid */}
          {asset.metadata?.attributes && asset.metadata.attributes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-sky-600" /> Asset Attributes
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {asset.metadata.attributes.map((attr: any, idx: number) => (
                  <div key={idx} className="bg-sky-50/60 border border-sky-200/80 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">
                      {attr.trait_type || "Attribute"}
                    </span>
                    <span className="text-sm font-bold text-sky-800 mt-0.5 block truncate">
                      {String(attr.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockchain Provenance Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Owner DID
              </span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-slate-800">{asset.ownerDid.substring(0, 22)}...</span>
                <button
                  onClick={() => copyText(asset.ownerDid)}
                  className="text-slate-400 hover:text-slate-800 p-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Minted Date
              </span>
              <span className="text-slate-800 font-medium">{new Date(asset.mintedAt).toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-semibold">IPFS Metadata URI</span>
              <a
                href={asset.metadataUri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:underline font-bold flex items-center gap-1 font-mono"
              >
                <span>{asset.metadataUri.substring(0, 24)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
