import React, { useState, useEffect } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuthSession, NFTAsset } from "@ciphertrust/shared-types";
import { Layers, Search, RefreshCw, ExternalLink, ShieldCheck, Sparkles, Send, Copy, Check } from "lucide-react";
import { AssetDetailModal } from "./AssetDetailModal";
import { TransferAssetModal } from "./TransferAssetModal";

interface AssetInventoryPageProps {
  client: CipherTrustClient;
  session: AuthSession | null;
}

export const AssetInventoryPage: React.FC<AssetInventoryPageProps> = ({ client, session }) => {
  const [assets, setAssets] = useState<NFTAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<NFTAsset | null>(null);
  const [transferAsset, setTransferAsset] = useState<NFTAsset | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const targetDid = session?.did || `did:ethr:31337:0x70997970C51812dc3A010C7d01b50e0d17dc79C8`;

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const inventory = await client.getInventory(targetDid);
      setAssets(inventory);
    } catch (err) {
      console.error("Failed to fetch digital asset inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [targetDid]);

  const copyText = (text: string, type: "token" | "contract", key: string) => {
    navigator.clipboard.writeText(text);
    if (type === "token") {
      setCopiedTokenId(key);
      setTimeout(() => setCopiedTokenId(null), 2000);
    } else {
      setCopiedContract(key);
      setTimeout(() => setCopiedContract(null), 2000);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const nameMatch = asset.metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = asset.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const tokenMatch = asset.tokenId.includes(searchQuery);
    return nameMatch || descMatch || tokenMatch;
  });

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-sky-600" />
            Digital Asset Inventory
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Verifiable ERC-721 Digital Tokens linked to DID <code className="font-bold text-sky-700">{targetDid.substring(0, 24)}...</code>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <button
            onClick={fetchInventory}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 p-2.5 rounded-xl transition-all"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Verifiable Assets Found</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-sm mx-auto">
              Mint new digital identity passes or access tokens via the Admin Console to view them here.
            </p>
          </div>
          <a
            href="http://localhost:3006"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-sky-500/20 transition-all"
          >
            <span>Open Admin Console to Issue Asset</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset, idx) => {
            const cardKey = `${asset.contractAddress}-${asset.tokenId}-${idx}`;
            return (
              <div
                key={cardKey}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col group relative"
              >
                {/* Card Image */}
                <div
                  onClick={() => setSelectedAsset(asset)}
                  className="aspect-square bg-slate-100 overflow-hidden relative cursor-pointer"
                >
                  <img
                    src={asset.metadata?.image || "https://picsum.photos/400/400"}
                    alt={asset.metadata?.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-sky-700 border border-sky-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <span>Token ID: #{asset.tokenId}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyText(asset.tokenId, "token", cardKey);
                      }}
                      className="hover:text-sky-900"
                      title="Copy Token ID"
                    >
                      {copiedTokenId === cardKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div onClick={() => setSelectedAsset(asset)} className="cursor-pointer">
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                      {asset.metadata?.name || `CipherTrust Token #${asset.tokenId}`}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
                      {asset.metadata?.description || "Verifiable identity asset."}
                    </p>
                  </div>

                  {/* Metadata Rows: Token ID + Contract Address */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Contract:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-sky-700">
                        <span>{asset.contractAddress.substring(0, 6)}...{asset.contractAddress.substring(asset.contractAddress.length - 4)}</span>
                        <button
                          onClick={() => copyText(asset.contractAddress, "contract", cardKey)}
                          className="text-slate-400 hover:text-slate-800"
                          title="Copy Contract Address"
                        >
                          {copiedContract === cardKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Authenticated
                      </span>

                      {/* Transfer Action Button */}
                      <button
                        onClick={() => setTransferAsset(asset)}
                        className="flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1 rounded-lg transition-colors"
                        title="Transfer Asset"
                      >
                        <Send className="w-3 h-3" />
                        <span>Transfer</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Detail Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />

      {/* Transfer Asset Modal */}
      <TransferAssetModal
        client={client}
        asset={transferAsset}
        onClose={() => setTransferAsset(null)}
        onSuccess={fetchInventory}
      />
    </div>
  );
};
