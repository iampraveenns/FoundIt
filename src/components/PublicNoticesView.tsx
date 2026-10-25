import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  AlertTriangle,
  Gavel,
  Clock,
  Printer,
  Search,
  ExternalLink,
  ShieldAlert,
  Building,
  CheckCircle,
} from 'lucide-react';

interface LegalNotice {
  noticeId: string;
  itemId: string;
  itemName: string;
  category: string;
  color: string;
  intakeDate: string;
  claimDeadline: string;
  daysRemaining: number;
  status: 'AUCTION_READY' | 'FINAL_NOTICE' | 'STATUTORY_HOLD';
  holdingDepot: string;
  statutoryRetentionPeriodDays: number;
}

export default function PublicNoticesView() {
  const [notices, setNotices] = useState<LegalNotice[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/notices/bulletin');
        const data = await res.json();
        if (data.success && Array.isArray(data.notices)) {
          setNotices(data.notices);
        }
      } catch (err) {
        console.warn('Failed to load notices:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter((n) => {
    if (filterStatus !== 'All' && n.status !== filterStatus) return false;
    if (searchQuery && !n.itemName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <Gavel className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Official Municipal Property Gazette &bull; Legal Notice Bulletin
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pursuant to NY Personal Property Law Article 7-B (§§ 251–258). Unclaimed property published prior to auction.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-2 shadow-xs"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print Official Gazette</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search gazetted items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
          {['All', 'STATUTORY_HOLD', 'FINAL_NOTICE', 'AUCTION_READY'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? 'All Notices' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Gazette Items Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Notice ID</th>
                <th className="py-3 px-4">Item &amp; Category</th>
                <th className="py-3 px-4">Custody Depot</th>
                <th className="py-3 px-4">Intake Date</th>
                <th className="py-3 px-4">Statutory Deadline</th>
                <th className="py-3 px-4">Status &bull; Auction Countdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredNotices.map((notice) => (
                <tr key={notice.noticeId} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{notice.noticeId}</td>
                  <td className="py-3.5 px-4">
                    <strong className="text-slate-900 block font-bold">{notice.itemName}</strong>
                    <span className="text-[11px] text-slate-500">{notice.category} &bull; {notice.color}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{notice.holdingDepot}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {new Date(notice.intakeDate).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {new Date(notice.claimDeadline).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        notice.status === 'AUCTION_READY'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : notice.status === 'FINAL_NOTICE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {notice.status === 'AUCTION_READY' ? (
                        <>🔨 Auction Ready</>
                      ) : (
                        <>⏱️ {notice.daysRemaining} Days Left</>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
