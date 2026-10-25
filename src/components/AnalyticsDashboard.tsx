import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  MapPin,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

const RECOVERY_TIMELINE_DATA = [
  { day: 'Mon', reported: 18, verified: 12, handshakes: 10 },
  { day: 'Tue', reported: 24, verified: 17, handshakes: 15 },
  { day: 'Wed', reported: 31, verified: 26, handshakes: 22 },
  { day: 'Thu', reported: 28, verified: 24, handshakes: 21 },
  { day: 'Fri', reported: 42, verified: 35, handshakes: 30 },
  { day: 'Sat', reported: 36, verified: 29, handshakes: 27 },
  { day: 'Sun', reported: 22, verified: 19, handshakes: 18 },
];

const CATEGORY_PIE_DATA = [
  { name: 'Electronics', value: 34, color: '#0284c7' },
  { name: 'Bags & Wallets', value: 28, color: '#f59e0b' },
  { name: 'Keys & Badges', value: 18, color: '#f43f5e' },
  { name: 'Eyewear', value: 12, color: '#8b5cf6' },
  { name: 'Other', value: 8, color: '#10b981' },
];

const AGENCY_PERFORMANCE_DATA = [
  { agency: 'MTA NYC Transit', intake: 142, reunited: 118, rate: 83.1 },
  { agency: 'Amtrak Northeast', intake: 68, reunited: 56, rate: 82.3 },
  { agency: 'Port Authority NYNJ', intake: 54, reunited: 42, rate: 77.7 },
  { agency: 'JFK Airport TSA', intake: 89, reunited: 73, rate: 82.0 },
  { agency: 'Metro-North', intake: 45, reunited: 38, rate: 84.4 },
];

const CORRIDOR_HEATMAP = [
  { corridor: 'Grand Central Terminal (42nd St)', density: 'HIGH', count: 67, alertRate: '98%', status: 'Active' },
  { corridor: 'Penn Station / Moynihan Hall', density: 'HIGH', count: 58, alertRate: '95%', status: 'Active' },
  { corridor: 'Times Square - 42nd St Subway', density: 'CRITICAL', count: 82, alertRate: '92%', status: 'Peak' },
  { corridor: 'Union Square 14th St Interchange', density: 'MEDIUM', count: 39, alertRate: '96%', status: 'Normal' },
  { corridor: 'SoHo Broadway Shopping Corridor', density: 'MEDIUM', count: 34, alertRate: '94%', status: 'Normal' },
  { corridor: 'JFK Terminal 4 Customs Baggage', density: 'HIGH', count: 47, alertRate: '99%', status: 'Secured' },
];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'quarter'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in">
      {/* Top Header & Range Switcher */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enterprise Analytics &amp; Recovery Intelligence</h2>
              <p className="text-xs text-slate-500">
                Multi-agency intake metrics, secondary Gemini verification velocity, and custody chain performance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['7d', '30d', 'quarter'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition ${
                  timeRange === r ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Q3 Regional'}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
            title="Refresh metrics stream"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">30-Day Recovery Rate</span>
            <span className="flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +6.4%
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight text-slate-900">82.4%</div>
          <p className="text-[11px] text-slate-500">327 of 397 items successfully returned to owners</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Avg Handshake Turnaround</span>
            <span className="flex items-center text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              ⚡ 4.2 Hours
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight text-slate-900">4h 12m</div>
          <p className="text-[11px] text-slate-500">From citizen intake to physical custody transfer</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">AI Verification Precision</span>
            <span className="flex items-center text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Sparkles className="w-3 h-3 mr-0.5 text-amber-500" /> 96.8%
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight text-slate-900">96.8%</div>
          <p className="text-[11px] text-slate-500">Gemini secondary forensic match concordance</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Custody Chain Integrity</span>
            <span className="flex items-center text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              <ShieldCheck className="w-3 h-3 mr-0.5" /> 100% Sealed
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight text-slate-900">0 Breaches</div>
          <p className="text-[11px] text-slate-500">All transfer manifests verified by dual officer badge</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inflow vs Handshakes Timeline */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Intake Inflow vs. Verified Custody Handshakes</h3>
              <p className="text-xs text-slate-500">Daily velocity of reported items versus completed owner handshakes</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Intake
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Reunited
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RECOVERY_TIMELINE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorReunited" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="reported" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReported)" name="Reported Items" />
                <Area type="monotone" dataKey="handshakes" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReunited)" name="Handshakes Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Category Distribution</h3>
            <p className="text-xs text-slate-500">Intake volume by classification</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {CATEGORY_PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {CATEGORY_PIE_DATA.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-600 truncate text-[11px]">{cat.name}:</span>
                <strong className="text-slate-900 text-[11px]">{cat.value}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Agency Hub Performance & Heatmap Corridors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agency Leaderboard */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Multi-Agency Recovery Rates</h3>
              <p className="text-xs text-slate-500">Inter-agency performance across metropolitan jurisdictions</p>
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 font-bold">
              5 Connected Agencies
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {AGENCY_PERFORMANCE_DATA.map((agency) => (
              <div key={agency.agency} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{agency.agency}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px]">{agency.reunited}/{agency.intake} items</span>
                    <strong className="text-indigo-600 font-bold">{agency.rate}%</strong>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${agency.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geospatial Heatmap Transit Corridors */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transit Corridor Density Heatmap</h3>
              <p className="text-xs text-slate-500">Geospatial cluster hot-spots mapped across terminals</p>
            </div>
            <MapPin className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {CORRIDOR_HEATMAP.map((c) => (
              <div key={c.corridor} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{c.corridor}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                    <span>{c.count} active reports</span>
                    <span>&bull;</span>
                    <span>Radius alert precision: <strong className="text-emerald-600">{c.alertRate}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      c.density === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : c.density === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {c.density} DENSITY
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
