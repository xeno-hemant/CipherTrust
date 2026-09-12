import React, { useState } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { Plus, Trash2, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Loader2, Copy, Check } from "lucide-react";

interface IssueAssetPageProps {
  client: CipherTrustClient;
}

export const IssueAssetPage: React.FC<IssueAssetPageProps> = ({ client }) => {
  const [recipient, setRecipient] = useState("0x3C44CdD45913C54E43525531E03c981708277271");
  const [name, setName] = useState("Corporate Executive Identity Clearance");
  const [description, setDescription] = useState("Level 5 Security Access Pass issued by CipherTrust Security Operations.");
  const [image, setImage] = useState("https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/official-artwork/150.png");
  
  const [attributes, setAttributes] = useState<{ trait_type: string; value: string }[]>([
    { trait_type: "Security Clearance", value: "Level 5" },
    { trait_type: "Department", value: "Executive Board" },
  ]);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState(false);

  const addAttributeRow = () => {
    setAttributes([...attributes, { trait_type: "", value: "" }]);
  };

  const updateAttributeRow = (index: number, field: "trait_type" | "value", val: string) => {
    const updated = [...attributes];
    updated[index][field] = val;
    setAttributes(updated);
  };

  const removeAttributeRow = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessResult(null);
    setStatusMsg("Step 1/3: Pinning metadata JSON to IPFS gateway...");

    try {
      setTimeout(() => {
        if (loading) setStatusMsg("Step 2/3: Executing on-chain mint transaction via CipherTrustNFT contract...");
      }, 1000);

      const result = await client.mintNft({
        recipientAddress: recipient,
        name,
        description,
        image,
        attributes,
      });

      setSuccessResult(result);
      setStatusMsg(null);
    } catch (err: any) {
      console.error("Minting asset failed:", err);
      setErrorMsg(err.message || "Failed to mint digital asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-sky-600" />
          Issue Verifiable Digital Asset
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Mint W3C & ERC-721 metadata compliant identity credentials pinned directly to IPFS and linked on-chain.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={handleMint} className="space-y-6">
          {/* Recipient */}
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-sky-700 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Name & Image URL Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Asset Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Identity Access Pass"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Image Media URL *
              </label>
              <input
                type="url"
                required
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Credential Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe access privileges, clearance level, or validity period..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Dynamic Attributes Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Verifiable Attributes / Traits
              </label>
              <button
                type="button"
                onClick={addAttributeRow}
                className="flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Trait
              </button>
            </div>

            {attributes.map((attr, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Trait Type (e.g. Clearance)"
                  value={attr.trait_type}
                  onChange={(e) => updateAttributeRow(idx, "trait_type", e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Trait Value (e.g. Level 5)"
                  value={attr.value}
                  onChange={(e) => updateAttributeRow(idx, "value", e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => removeAttributeRow(idx)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Status Message / Errors */}
          {statusMsg && (
            <div className="flex items-center gap-2 p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-sky-600 flex-shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold py-3.5 rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{loading ? "Minting Asset..." : "Confirm & Mint Verifiable Asset"}</span>
          </button>
        </form>

        {/* Success Card */}
        {successResult && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Asset Minted & IPFS Pinned Successfully!</span>
            </div>
            <div className="text-xs text-slate-700 space-y-2 font-mono font-semibold">
              <p className="flex items-center gap-2">
                <span>Token ID: #{successResult.tokenId}</span>
              </p>
              <div className="flex items-center gap-2">
                <span>Contract: {successResult.contractAddress.substring(0, 10)}...{successResult.contractAddress.substring(successResult.contractAddress.length - 6)}</span>
                <button
                  onClick={() => copyText(successResult.contractAddress)}
                  className="text-slate-500 hover:text-slate-900"
                  title="Copy Contract Address"
                >
                  {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p>IPFS CID: {successResult.metadataUri}</p>
              <p>Owner DID: {successResult.ownerDid}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
