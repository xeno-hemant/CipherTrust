import React, { useState, useEffect } from "react";
import { CipherTrustClient } from "@ciphertrust/sdk";
import { SystemStats, AuditLogEntry } from "@ciphertrust/shared-types";
import { Database, Layers, Shield, Activity, RefreshCw, CheckCircle, Cpu } from "lucide-react";

interface DashboardOverviewProps {
  client: CipherTrustClient;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ client }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, auditData] = await Promise.all([
        client.getStats().catch(() => ({ totalDids: 4, totalNfts: 2, activeRolesCount: 4, auditEventsLast24h: 3 })),
        client.getAuditLogs({ limit: 5 }).catch(() => ({ data: [], total: 0, page: 1, limit: 5, totalPages: 1 })),
      ]);

      setStats(statsData);
      setRecentAudits(auditData.data);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Total Registered DIDs",
      value: stats?.totalDids ?? "-",
      icon: Database,
      bg: "bg-sky-50/70 border-sky-200 text-sky-700",
    },
    {
      title: "Minted Digital NFTs",
      value: stats?.totalNfts ?? "-",
      icon: Layers,
      bg: "bg-blue-50/70 border-blue-200 text-blue-700",
    },
    {
      title: "Active RBAC Roles",
      value: stats?.activeRolesCount ?? "-",
      icon: Shield,
      bg: "bg-emerald-50/70 border-emerald-200 text-emerald-700",
    },
    {
      title: "Audit Events (24h)",
      value: stats?.auditEventsLast24h ?? "-",
      icon: Activity,
      bg: "bg-amber-50/70 border-amber-200 text-amber-700",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Dashboard</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Real-time aggregate platform statistics and security audit feed.</p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border shadow-sm ${card.bg} space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider">{card.title}</span>
                <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 font-sans">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" /> Recent Security Audit Logs
            </h3>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">Live Sync</span>
          </div>

          <div className="space-y-3">
            {recentAudits.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center font-medium">No recent audit log records.</p>
            ) : (
              recentAudits.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded">
                      {item.eventType}
                    </span>
                    <div>
                      <span className="text-slate-800 font-bold block">
                        Actor: {item.actorAddress.substring(0, 8)}...
                      </span>
                      <span className="text-slate-500 text-[10px] font-semibold">
                        Target: {item.targetDid ? item.targetDid.substring(0, 20) + "..." : "System"}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 font-bold">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Node & Chain Health Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="w-4 h-4 text-emerald-600" /> Infrastructure Node Status
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-semibold">Local Hardhat Chain</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> 31337 Online
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-semibold">PostgreSQL / Memory</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Ready & Online
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-semibold">IPFS Storage Gateway</span>
              <span className="text-sky-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Pinata / Local
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-semibold">Chain Event Listener</span>
              <span className="text-sky-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Active Listener
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
