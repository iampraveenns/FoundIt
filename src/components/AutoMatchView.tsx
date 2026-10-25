import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Eye,
  PlusCircle,
} from 'lucide-react';
import { FoundItem } from '../types.ts';

interface LostReportItem {
  _id: string;
  reportNumber: string;
  reporterName: string;
  reporterEmail: string;
  itemName: string;
  category: string;
  primaryColor: string;
  detailedDescription: string;
  lastSeenLocationName: string;
  status: string;
  potentialMatches: Array<{
    itemId: string;
    itemName: string;
    score: number;
    matchRationale: string;
    detectedAt: string;
    claimInitiated: boolean;
  }>;
  createdAt: string;
}

interface AutoMatchViewProps {
  onOpenReportLost: () => void;
  onInitiateClaim: (item: FoundItem) => void;
  onSelectItem: (item: FoundItem) => void;
}

export default function AutoMatchView({
  onOpenReportLost,
  onInitiateClaim,
  onSelectItem,
}: AutoMatchViewProps) {
  const [reports, setReports] = useState<LostReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<LostReportItem | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/lost-reports');
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
        if (data.reports.length > 0 && !selectedReport) {
          setSelectedReport(data.reports[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch lost reports:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRematch = async (id: string) => {
    setRecalculatingId(id);
    try {
      const res = await fetch(`/api/lost-reports/${id}/rematch`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.report) {
        setReports((prev) => prev.map((r) => (r._id === id ? data.report : r)));
        if (selectedReport?._id === id) {
          setSelectedReport(data.report);
        }
      }
    } catch (e) {
      console.error('Failed to rematch:', e);
    } finally {
      setRecalculatingId(null);
    }
  };

  const handleClaimMatch = async (itemId: string) => {
    try {
      const res = await fetch(`/api/items/${itemId}`);
      const data = await res.json();
      if (data.success && data.item) {
        onInitiateClaim(data.item);
      }
    } catch (e) {
      console.error('Failed to load item for claim:', e);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterCategory === 'All') return true;
    return r.category === filterCategory;
  });

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in">
      {/* Top Controller Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lost Property Registry &amp; Auto-Matching Engine</h2>
              <p className="text-xs text-slate-500">
                Continuous vector correlation matching citizen lost notices against municipal found intake items.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <button
            onClick={onOpenReportLost}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-2xl transition flex items-center gap-2 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File Lost Report</span>
          </button>

          <button
            onClick={fetchReports}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left List + Right Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Lost Notices Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span className="font-semibold text-slate-700">Registered Lost Notices ({filteredReports.length})</span>
            <span className="text-[11px]">Ranked by Vector Score</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredReports.map((report) => {
              const isSelected = selectedReport?._id === report._id;
              const matchesCount = report.potentialMatches?.length || 0;
              const topScore = matchesCount > 0 ? Math.round(report.potentialMatches[0].score * 100) : 0;

              return (
                <div
                  key={report._id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-100 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {report.reportNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 truncate">{report.itemName}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{report.lastSeenLocationName}</p>

                  <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-100">
                    <span className="text-slate-500">
                      {matchesCount > 0 ? (
                        <span className="text-emerald-700 font-semibold">
                          ✓ {matchesCount} Candidate Match{matchesCount > 1 ? 'es' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">Scanning for matches...</span>
                      )}
                    </span>
                    {topScore > 0 && (
                      <span className="font-mono font-bold text-amber-700">
                        Top: {topScore}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Notice & AI Candidate Matches */}
        <div className="lg:col-span-7">
          {selectedReport ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-amber-700 font-bold block">
                    Lost Notice Dossier &bull; {selectedReport.reportNumber}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedReport.itemName}</h3>
                </div>
                <button
                  onClick={() => handleRematch(selectedReport._id)}
                  disabled={recalculatingId === selectedReport._id}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto border border-slate-200"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      recalculatingId === selectedReport._id ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Re-Score Catalog</span>
                </button>
              </div>

              {/* Description & Metadata */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <p className="text-slate-700 leading-relaxed italic">"{selectedReport.detailedDescription}"</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <div>Category: <strong className="text-slate-800">{selectedReport.category}</strong></div>
                  <div>Color: <strong className="text-slate-800">{selectedReport.primaryColor}</strong></div>
                  <div>Last Seen: <strong className="text-slate-800">{selectedReport.lastSeenLocationName}</strong></div>
                </div>
              </div>

              {/* Scored Candidate Matches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    AI Vector Matches in Found Property Vault ({selectedReport.potentialMatches?.length || 0})
                  </h4>
                  <span className="text-[10px] text-slate-500">Multi-Factor Scored</span>
                </div>

                {(!selectedReport.potentialMatches || selectedReport.potentialMatches.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                    No matching items found in the current intake vault yet. Automatic background scanners run 24/7.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedReport.potentialMatches.map((m, idx) => {
                      const scorePercent = Math.round(m.score * 100);

                      return (
                        <div
                          key={m.itemId || idx}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs hover:border-slate-300 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Vault Item
                                </span>
                                <h5 className="text-xs font-bold text-slate-900">{m.itemName}</h5>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{m.matchRationale}</p>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span
                                className={`text-base font-black font-mono block ${
                                  scorePercent >= 85
                                    ? 'text-emerald-700'
                                    : scorePercent >= 70
                                    ? 'text-amber-700'
                                    : 'text-slate-500'
                                }`}
                              >
                                {scorePercent}%
                              </span>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Match Score</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                            <button
                              onClick={() => handleClaimMatch(m.itemId)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Initiate Ownership Claim</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-xs">
              <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Select a lost report</p>
              <p className="text-xs text-slate-500">View continuous auto-matches and initiate ownership claims.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
