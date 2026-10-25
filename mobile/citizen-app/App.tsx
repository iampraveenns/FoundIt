import React, { useState } from 'react';

/**
 * FoundIt Citizen Companion Mobile Application
 * Framework: React Native / Expo
 * 
 * Features:
 * - Real-time push alert stream for items found within watch radius
 * - Active claims tracker with live Gemini forensic evaluation status
 * - One-click Digital Pickup Voucher wallet with rolling TOTP code
 * - Offline cached lost property notice creator
 */

export interface CitizenClaimView {
  id: string;
  itemName: string;
  status: 'SUBMITTED' | 'AI_APPROVED' | 'READY_FOR_PICKUP' | 'COMPLETED';
  stationName: string;
  lockerBin: string;
  claimCode: string;
}

const SAMPLE_CITIZEN_CLAIMS: CitizenClaimView[] = [
  {
    id: 'CLAIM-8819',
    itemName: 'Apple AirPods Pro 2 with Blue Carabiner',
    status: 'READY_FOR_PICKUP',
    stationName: 'Grand Central Terminal Hub',
    lockerBin: 'LOCKER-CONCOURSE-A14',
    claimCode: '841-902',
  },
  {
    id: 'CLAIM-8824',
    itemName: 'Brown Leather Bifold Wallet',
    status: 'AI_APPROVED',
    stationName: 'Penn Station Custody Counter',
    lockerBin: 'PENDING_OFFICER_SIGN',
    claimCode: '319-482',
  },
];

export default function CitizenCompanionApp() {
  const [activeTab, setActiveTab] = useState<'claims' | 'radar' | 'report'>('claims');
  const [claims] = useState<CitizenClaimView[]>(SAMPLE_CITIZEN_CLAIMS);
  const [selectedPass, setSelectedPass] = useState<CitizenClaimView | null>(claims[0]);

  return (
    <div className="flex flex-col h-full min-h-[640px] bg-slate-950 text-white font-sans max-w-md mx-auto border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
      {/* Device Status Bar */}
      <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-slate-300">CITIZEN SHIELD SECURE</span>
        </div>
        <span className="font-mono">5G &bull; 94%</span>
      </div>

      {/* App Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
            FoundIt Citizen Companion
          </span>
          <h2 className="text-base font-bold text-white leading-tight">My Recovered Property</h2>
        </div>
        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30 font-bold">
          {claims.length} Active
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {activeTab === 'claims' && (
          <div className="space-y-3">
            {selectedPass && (
              <div className="p-4 bg-gradient-to-br from-indigo-900/80 to-slate-900 border-2 border-indigo-500/60 rounded-3xl space-y-3 shadow-xl text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                  Digital Pickup Voucher Pass
                </span>
                <h4 className="text-sm font-bold text-white">{selectedPass.itemName}</h4>

                {/* QR Box */}
                <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM40 30h10v10H40zM60 40h10v10H60zM40 60h10v10H40zM70 70h20v20H70z" />
                  </svg>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">One-Time Handover Code (TOTP)</span>
                  <span className="text-xl font-black font-mono text-amber-300">{selectedPass.claimCode}</span>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl text-left text-[11px] space-y-1">
                  <div>Station: <strong className="text-white">{selectedPass.stationName}</strong></div>
                  <div>Locker: <strong className="text-emerald-400 font-mono">{selectedPass.lockerBin}</strong></div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <span className="font-bold text-slate-300 block">All Claims</span>
              {claims.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedPass(c)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    selectedPass?.id === c.id
                      ? 'bg-indigo-950/60 border-indigo-500'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div>
                    <h5 className="font-bold text-white">{c.itemName}</h5>
                    <span className="text-[10px] text-slate-400">{c.stationName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'radar' && (
          <div className="space-y-3 text-center py-6">
            <div className="w-40 h-40 mx-auto rounded-full border-2 border-indigo-500/50 flex items-center justify-center relative overflow-hidden bg-indigo-950/20">
              <span className="text-3xl">📡</span>
              <div className="absolute inset-0 rounded-full border border-teal-400 animate-ping opacity-50" />
            </div>
            <h4 className="text-xs font-bold text-white">Geospatial Radius Radar Active</h4>
            <p className="text-[11px] text-slate-400">
              Watching 15 km perimeter around Midtown Transit Corridor. You will receive native alerts if a matching item is turned in.
            </p>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-bold text-white">Report Missing Property</h4>
            <p className="text-[11px] text-slate-400">
              Filing a lost notice runs instant multi-factor AI vector searches against all municipal lockers.
            </p>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 block text-[10px]">Fast Sync Mode:</span>
              <span className="text-white font-semibold">Automatic Offline Queue &amp; Background Push</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="bg-slate-900 border-t border-slate-800 p-2 flex items-center justify-around text-xs">
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-xl transition ${
            activeTab === 'claims' ? 'text-indigo-400 font-bold bg-slate-950' : 'text-slate-400'
          }`}
        >
          <span>🎫</span>
          <span>Passes</span>
        </button>
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-xl transition ${
            activeTab === 'radar' ? 'text-indigo-400 font-bold bg-slate-950' : 'text-slate-400'
          }`}
        >
          <span>📡</span>
          <span>Radar</span>
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-xl transition ${
            activeTab === 'report' ? 'text-indigo-400 font-bold bg-slate-950' : 'text-slate-400'
          }`}
        >
          <span>🔍</span>
          <span>Report</span>
        </button>
      </div>
    </div>
  );
}
