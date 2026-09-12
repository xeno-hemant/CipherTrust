import React, { useState, useEffect } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { AuditLogEntry } from "@ciphertrust/shared-types";
import { FileText, Search, ExternalLink, Filter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLogPageProps {
  client: CipherTrustClient;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ client }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [actorQuery, setActorQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await client.getAuditLogs({
        eventType: eventTypeFilter || undefined,
        actor: actorQuery || undefined,
        page,
        limit: 10,
      });

      setLogs(res.data);
      setTotalPages(res.totalPages);
      setTotalEntries(res.total);
    } catch (err) {
      console.error("Failed to fetch audit log trail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 5000);
    return () => clearInterval(interval);
  }, [eventTypeFilter, actorQuery, page]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-sky-600" />
            Immutable On-Chain Audit Log
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Read-through security audit trail synced live from <code className="font-bold text-sky-700">CipherTrustAudit</code> smart contract logs.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
          <span>Sync Now ({totalEntries} Events)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Event Type Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-800 focus:outline-none"
            >
              <option value="">All Event Types</option>
              <option value="DID_CREATED">DID_CREATED</option>
              <option value="NFT_MINTED">NFT_MINTED</option>
              <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
              <option value="ROLE_REVOKED">ROLE_REVOKED</option>
              <option value="OWNERSHIP_TRANSFERRED">OWNERSHIP_TRANSFERRED</option>
            </select>
          </div>

          {/* Actor Query Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Actor Address..."
              value={actorQuery}
              onChange={(e) => {
                setActorQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Pagination Buttons */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span>Page {page} of {totalPages}</span>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Event Type</th>
                <th className="p-4">Actor Address</th>
                <th className="p-4">Target DID</th>
                <th className="p-4">Transaction Hash</th>
                <th className="p-4">Block #</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No audit records matching query criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <span className="bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">
                      {log.actorAddress.substring(0, 8)}...{log.actorAddress.substring(log.actorAddress.length - 4)}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-600">
                      {log.targetDid ? `${log.targetDid.substring(0, 22)}...` : "-"}
                    </td>
                    <td className="p-4">
                      <a
                        href={`https://etherscan.io/tx/${log.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-sky-600 hover:underline flex items-center gap-1"
                      >
                        <span>{log.txHash.substring(0, 10)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="p-4 text-slate-600 font-mono font-semibold">#{log.blockNumber}</td>
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
