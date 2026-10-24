import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  Clock,
  UserCheck,
  FileCheck2,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { AuditLogEntry } from '../types.ts';

interface AuditLogViewProps {
  currentUserRole?: string;
}

export default function AuditLogView({ currentUserRole = 'Standard' }: AuditLogViewProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // In demo mode, fetch audit logs (if officer/admin, token is attached or endpoint responds)
      const token = localStorage.getItem('foundit_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/audit-logs', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUserRole]);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'All' || log.action === filterAction;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.userName.toLowerCase().includes(q) ||
      (log.itemName && log.itemName.toLowerCase().includes(q)) ||
      (log.notes && log.notes.toLowerCase().includes(q)) ||
      log.action.toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Enterprise Audit Trail &amp; Handshake Logs</h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
              RBAC Protected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of custody handoffs, ownership verification responses, and transit officer overrides.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Trail
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by officer, item name, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['All', 'CLAIM_REQUESTED', 'ITEM_HANDSHAKE_COMPLETED', 'USER_ROLE_UPDATED'].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                filterAction === act
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {act === 'All' ? 'All Events' : act.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileCheck2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-400">No matching audit logs found</p>
              <p className="text-xs text-slate-500 mt-1">Audit events generate automatically during claims and handshakes.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isHandshake = log.action === 'ITEM_HANDSHAKE_COMPLETED';
              const isClaim = log.action === 'CLAIM_REQUESTED';

              return (
                <div key={log._id || log.id} className="p-4 sm:p-5 hover:bg-slate-800/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          isHandshake
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isClaim
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {log.itemName && (
                        <span className="text-xs font-bold text-white truncate">
                          &bull; {log.itemName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{log.notes}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                      <span>Initiator: <strong className="text-slate-200">{log.userName}</strong></span>
                      <span>Role: <strong className="text-indigo-400">{log.userRole}</strong></span>
                      {log.metadata?.handoverStation && (
                        <span>Station: <strong className="text-slate-200">{log.metadata.handoverStation}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 whitespace-nowrap self-end sm:self-center">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
