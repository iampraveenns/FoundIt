import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Building,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Truck,
  Box,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  FileText,
  UserCheck,
  Send,
  Lock,
} from 'lucide-react';
import { CLAIM_STATES } from '../../models/Claim.js';

interface ClaimItem {
  _id: string;
  itemId: string;
  itemName: string;
  claimantName: string;
  claimantEmail: string;
  state: string;
  ownershipProof: {
    challengeAnswer: string;
    serialNumberOrEngraving?: string;
    identifyingMarks?: string;
    lossLocationDescription?: string;
  };
  aiVerification?: {
    confidenceScore: number;
    matchAssessment: string;
    recommendation: string;
    verifiedAttributes: string[];
    discrepancies: string[];
    reasoning: string;
    evaluatedAt: string;
  };
  officerReview?: {
    officerDecision: string;
    officerNotes: string;
  };
  handshakeSchedule?: {
    assignedHubName?: string;
    pickupLockerBin?: string;
  };
  createdAt: string;
}

interface TransitHub {
  hubCode: string;
  name: string;
  agency: string;
  address: string;
  storageZones: Array<{
    zoneCode: string;
    name: string;
    securityLevel: string;
    capacity: number;
    occupiedCount: number;
  }>;
  totalItemsStored: number;
  transferManifests: any[];
}

interface ClaimsHubManagerProps {
  currentUserRole?: string;
  currentUserName?: string;
}

export default function ClaimsHubManager({
  currentUserRole = 'TransitOfficer',
  currentUserName = 'Officer David Chen',
}: ClaimsHubManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'claims' | 'hubs' | 'transfers'>('claims');
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [hubs, setHubs] = useState<TransitHub[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [filterState, setFilterState] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [selectedLocker, setSelectedLocker] = useState('LOCKER-CONCOURSE-A14');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [claimsRes, hubsRes, transfersRes] = await Promise.all([
        fetch('/api/claims'),
        fetch('/api/hubs'),
        fetch('/api/hubs/transfers/all'),
      ]);
      const claimsData = await claimsRes.json();
      const hubsData = await hubsRes.json();
      const transfersData = await transfersRes.json();

      if (claimsData.success) {
        setClaims(claimsData.claims);
        if (claimsData.claims.length && !selectedClaim) {
          setSelectedClaim(claimsData.claims[0]);
        }
      }
      if (hubsData.success) setHubs(hubsData.hubs);
      if (transfersData.success) setTransfers(transfersData.transfers);
    } catch (err) {
      console.warn('Failed to load claims/hubs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransition = async (targetState: string, decision?: string) => {
    if (!selectedClaim) return;
    try {
      const res = await fetch(`/api/claims/${selectedClaim._id}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetState,
          officerDecision: decision || 'APPROVED',
          notes: actionNotes || `Decision recorded by ${currentUserName}`,
          lockerBin: selectedLocker,
          hubId: 'HUB-GCT',
        }),
      });
      const data = await res.json();
      if (data.success && data.claim) {
        setClaims((prev) =>
          prev.map((c) => (c._id === data.claim._id ? data.claim : c))
        );
        setSelectedClaim(data.claim);
        setActionNotes('');
      }
    } catch (e) {
      console.error('Transition error:', e);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (filterState === 'All') return true;
    return c.state === filterState;
  });

  return (
    <div className="space-y-6 text-white animate-fade-in">
      {/* Top Controller Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Claim State Machine &amp; Multi-Agency Custody Hub</h2>
              <p className="text-xs text-slate-400">
                Automated secondary Gemini verification pipeline, locker assignments, and inter-terminal transfers.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('claims')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'claims' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Claims Pipeline ({claims.length})
            </button>
            <button
              onClick={() => setActiveSubTab('hubs')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'hubs' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Agency Stations ({hubs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('transfers')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'transfers' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Terminal Transfers ({transfers.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW 1: CLAIMS STATE MACHINE PIPELINE */}
      {activeSubTab === 'claims' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Claims List Column */}
          <div className="lg:col-span-5 space-y-3">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {['All', 'AI_APPROVED', 'OFFICER_REVIEW', 'AI_FLAGGED', 'SCHEDULED_PICKUP', 'HANDSHAKE_COMPLETED'].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setFilterState(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                      filterState === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'All' ? 'All Claims' : st.replace(/_/g, ' ')}
                  </button>
                )
              )}
            </div>

            {/* Claim cards list */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredClaims.map((claim) => {
                const isSelected = selectedClaim?._id === claim._id;
                const score = Math.round((claim.aiVerification?.confidenceScore || 0) * 100);

                return (
                  <div
                    key={claim._id}
                    onClick={() => setSelectedClaim(claim)}
                    className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          claim.state === 'AI_APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : claim.state === 'AI_FLAGGED'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : claim.state === 'HANDSHAKE_COMPLETED'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {claim.state.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(claim.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate">{claim.itemName}</h4>
                    <p className="text-[11px] text-slate-400 truncate">Claimant: {claim.claimantName}</p>

                    <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-800/80">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        AI Score:
                      </span>
                      <strong
                        className={`font-mono font-bold ${
                          score >= 85 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}
                      >
                        {score}%
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Claim Forensic Dossier & Action Column */}
          <div className="lg:col-span-7">
            {selectedClaim ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold block">
                      Forensic Claim Dossier &bull; {selectedClaim._id}
                    </span>
                    <h3 className="text-base font-bold text-white">{selectedClaim.itemName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-800 px-3 py-1 rounded-xl text-slate-300 font-semibold">
                      State: <strong className="text-indigo-400">{selectedClaim.state}</strong>
                    </span>
                  </div>
                </div>

                {/* Claimant Proof Section */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    Claimant Submitted Proof
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Claimant Identity:</span>
                      <strong className="text-white">{selectedClaim.claimantName}</strong>
                      <span className="text-slate-400 text-[11px] block">{selectedClaim.claimantEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Challenge Response:</span>
                      <p className="text-slate-200 italic font-medium">"{selectedClaim.ownershipProof.challengeAnswer}"</p>
                    </div>
                    {selectedClaim.ownershipProof.serialNumberOrEngraving && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Stated Serial / Marks:</span>
                        <span className="text-slate-300">{selectedClaim.ownershipProof.serialNumberOrEngraving}</span>
                      </div>
                    )}
                    {selectedClaim.ownershipProof.lossLocationDescription && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Stated Loss Context:</span>
                        <span className="text-slate-300">{selectedClaim.ownershipProof.lossLocationDescription}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Gemini AI Forensic Assessment */}
                {selectedClaim.aiVerification && (
                  <div className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <h4 className="text-xs font-bold text-indigo-200">
                          Secondary Gemini AI Forensic Assessment
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        {Math.round(selectedClaim.aiVerification.confidenceScore * 100)}% Match Confidence
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedClaim.aiVerification.reasoning}
                    </p>

                    {selectedClaim.aiVerification.verifiedAttributes.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 block mb-1">
                          ✓ Verified Matching Attributes:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedClaim.aiVerification.verifiedAttributes.map((attr, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md"
                            >
                              {attr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedClaim.aiVerification.discrepancies.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 block mb-1">
                          ⚠️ Potential Discrepancies Flagged:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedClaim.aiVerification.discrepancies.map((disc, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md"
                            >
                              {disc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* State Machine Transition Actions (Transit Officer / Admin) */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      Officer State Machine Controls
                    </h4>
                    <span className="text-[10px] text-slate-400">Authorized: {currentUserName}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Assigned Locker Bin</label>
                      <input
                        type="text"
                        value={selectedLocker}
                        onChange={(e) => setSelectedLocker(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Officer Notes / Badge Ref</label>
                      <input
                        type="text"
                        placeholder="e.g. ID verified against transit ticket"
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {selectedClaim.state !== 'SCHEDULED_PICKUP' && selectedClaim.state !== 'HANDSHAKE_COMPLETED' && (
                      <button
                        onClick={() => handleTransition('SCHEDULED_PICKUP', 'APPROVED')}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                      >
                        <Clock className="w-3.5 h-3.5" /> Approve &amp; Schedule Locker
                      </button>
                    )}

                    {selectedClaim.state !== 'HANDSHAKE_COMPLETED' && (
                      <button
                        onClick={() => handleTransition('HANDSHAKE_COMPLETED', 'APPROVED')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Seal Physical Handshake
                      </button>
                    )}

                    {selectedClaim.state !== 'REJECTED' && selectedClaim.state !== 'HANDSHAKE_COMPLETED' && (
                      <button
                        onClick={() => handleTransition('REJECTED', 'REJECTED')}
                        className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold rounded-xl transition"
                      >
                        Reject Claim
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
                <FileText className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">Select a claim from the pipeline</p>
                <p className="text-xs">Inspect AI forensic reasoning and manage state transitions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-AGENCY TRANSIT STATIONS & LOCKER ZONES */}
      {activeSubTab === 'hubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hubs.map((hub) => (
            <div key={hub.hubCode} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {hub.hubCode}
                    </span>
                    <span className="text-[10px] text-slate-400">{hub.agency}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{hub.name}</h3>
                  <p className="text-xs text-slate-400">{hub.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-white">{hub.totalItemsStored}</span>
                  <span className="text-[10px] text-slate-500 block">Items in Custody</span>
                </div>
              </div>

              {/* Storage Zones Matrix */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 block">Zoning &amp; Locker Depository Banks:</span>
                <div className="space-y-1.5">
                  {hub.storageZones.map((z) => {
                    const percent = Math.round((z.occupiedCount / z.capacity) * 100);
                    return (
                      <div key={z.zoneCode} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{z.name}</span>
                          <span className="font-mono text-[11px] text-indigo-400">
                            {z.occupiedCount}/{z.capacity} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent > 80 ? 'bg-rose-500' : percent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: TERMINAL CUSTODY TRANSFERS */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Inter-Terminal Custody Transfer Manifests</h3>
                <p className="text-xs text-slate-400">Tamper-evident transport tracking across municipal agencies</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                Dual Badge Verification Enforced
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {transfers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No active transfer manifests.</div>
              ) : (
                transfers.map((m) => (
                  <div key={m.manifestId} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-300">{m.manifestId}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            m.status === 'RECEIVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {m.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Seal: {m.tamperEvidentSealNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-200 font-semibold">
                        <span>{m.originHubName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{m.destinationHubName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{m.notes}</p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 self-end sm:self-center">
                      <div>Dispatched by: <strong className="text-white">{m.dispatchedByOfficerName}</strong> ({m.dispatchedByBadge})</div>
                      {m.receivedByOfficerName && (
                        <div>Received by: <strong className="text-emerald-300">{m.receivedByOfficerName}</strong> ({m.receivedByBadge})</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
