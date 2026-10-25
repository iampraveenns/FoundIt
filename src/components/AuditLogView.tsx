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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-slate-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Enterprise Audit Trail &amp; Handshake Logs</h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              RBAC Protected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of custody handoffs, ownership verification responses, and transit officer overrides.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition flex items-center gap-1.5 border border-slate-200 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Trail
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by officer, item name, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['All', 'CLAIM_REQUESTED', 'ITEM_HANDSHAKE_COMPLETED', 'USER_ROLE_UPDATED'].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                filterAction === act
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {act === 'All' ? 'All Events' : act.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileCheck2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching audit logs found</p>
              <p className="text-xs text-slate-500 mt-1">Audit events generate automatically during claims and handshakes.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isHandshake = log.action === 'ITEM_HANDSHAKE_COMPLETED';
              const isClaim = log.action === 'CLAIM_REQUESTED';

              return (
                <div key={log._id || log.id} className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-slate-900">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          isHandshake
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isClaim
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {log.itemName && (
                        <span className="text-xs font-bold text-slate-900 truncate">
                          &bull; {log.itemName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{log.notes}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span>Initiator: <strong className="text-slate-800">{log.userName}</strong></span>
                      <span>Role: <strong className="text-indigo-600">{log.userRole}</strong></span>
                      {log.metadata?.handoverStation && (
                        <span>Station: <strong className="text-slate-800">{log.metadata.handoverStation}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 whitespace-nowrap self-end sm:self-center">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
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
