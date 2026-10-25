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
        if (claimsData.claims.length > 0 && !selectedClaim) {
          setSelectedClaim(claimsData.claims[0]);
        }
      }
      if (hubsData.success) setHubs(hubsData.hubs);
      if (transfersData.success) setTransfers(transfersData.manifests);
    } catch (err) {
      console.error('Failed to fetch claims/hubs data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransition = async (newState: string, officerDecision: string) => {
    if (!selectedClaim) return;
    try {
      const res = await fetch(`/api/claims/${selectedClaim._id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newState,
          officerDecision,
          officerNotes: actionNotes || 'Verified by transit officer in person or via automated check.',
          pickupLockerBin: selectedLocker,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClaims((prev) => prev.map((c) => (c._id === data.claim._id ? data.claim : c)));
        setSelectedClaim(data.claim);
        setActionNotes('');
        alert(`State updated successfully to: ${newState}`);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err: unknown) {
      alert(`Error updating claim state: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (filterState === 'All') return true;
    return c.state === filterState;
  });

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in">
      {/* Top Controller Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Claim State Machine &amp; Multi-Agency Custody Hub</h2>
              <p className="text-xs text-slate-500">
                Automated secondary Gemini verification pipeline, locker assignments, and inter-terminal transfers.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveSubTab('claims')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'claims' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Claims Pipeline ({claims.length})
            </button>
            <button
              onClick={() => setActiveSubTab('hubs')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'hubs' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agency Stations ({hubs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('transfers')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'transfers' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terminal Transfers ({transfers.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
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
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
                        ? 'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-100 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          claim.state === 'AI_APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : claim.state === 'AI_FLAGGED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : claim.state === 'HANDSHAKE_COMPLETED'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {claim.state.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(claim.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 truncate">{claim.itemName}</h4>
                    <p className="text-[11px] text-slate-500 truncate">Claimant: {claim.claimantName}</p>

                    <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        AI Score:
                      </span>
                      <strong
                        className={`font-mono font-bold ${
                          score >= 85 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-rose-700'
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
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold block">
                      Forensic Claim Dossier &bull; {selectedClaim._id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{selectedClaim.itemName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 px-3 py-1 rounded-xl text-slate-700 font-semibold border border-slate-200">
                      State: <strong className="text-indigo-600">{selectedClaim.state}</strong>
                    </span>
                  </div>
                </div>

                {/* Claimant Proof Section */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Claimant Submitted Proof
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Claimant Identity:</span>
                      <strong className="text-slate-900">{selectedClaim.claimantName}</strong>
                      <span className="text-slate-500 text-[11px] block">{selectedClaim.claimantEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Challenge Response:</span>
                      <p className="text-slate-800 italic font-medium">"{selectedClaim.ownershipProof.challengeAnswer}"</p>
                    </div>
                    {selectedClaim.ownershipProof.serialNumberOrEngraving && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Stated Serial / Marks:</span>
                        <span className="text-slate-700">{selectedClaim.ownershipProof.serialNumberOrEngraving}</span>
                      </div>
                    )}
                    {selectedClaim.ownershipProof.lossLocationDescription && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Stated Loss Context:</span>
                        <span className="text-slate-700">{selectedClaim.ownershipProof.lossLocationDescription}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Gemini AI Forensic Assessment */}
                {selectedClaim.aiVerification && (
                  <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-indigo-900">
                          Secondary Gemini AI Forensic Assessment
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {Math.round(selectedClaim.aiVerification.confidenceScore * 100)}% Match Confidence
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedClaim.aiVerification.reasoning}
                    </p>

                    {selectedClaim.aiVerification.verifiedAttributes.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 block mb-1">
                          ✓ Verified Matching Attributes:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedClaim.aiVerification.verifiedAttributes.map((attr, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md"
                            >
                              {attr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedClaim.aiVerification.discrepancies.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 block mb-1">
                          ⚠️ Potential Discrepancies Flagged:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedClaim.aiVerification.discrepancies.map((disc, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md"
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
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      Officer State Machine Controls
                    </h4>
                    <span className="text-[10px] text-slate-500">Authorized: {currentUserName}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Assigned Locker Bin</label>
                      <input
                        type="text"
                        value={selectedLocker}
                        onChange={(e) => setSelectedLocker(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-1">Officer Notes / Badge Ref</label>
                      <input
                        type="text"
                        placeholder="e.g. ID verified against transit ticket"
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {selectedClaim.state !== 'SCHEDULED_PICKUP' && selectedClaim.state !== 'HANDSHAKE_COMPLETED' && (
                      <button
                        onClick={() => handleTransition('SCHEDULED_PICKUP', 'APPROVED')}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Clock className="w-3.5 h-3.5" /> Approve &amp; Schedule Locker
                      </button>
                    )}

                    {selectedClaim.state !== 'HANDSHAKE_COMPLETED' && (
                      <button
                        onClick={() => handleTransition('HANDSHAKE_COMPLETED', 'APPROVED')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Seal Physical Handshake
                      </button>
                    )}

                    {selectedClaim.state !== 'REJECTED' && selectedClaim.state !== 'HANDSHAKE_COMPLETED' && (
                      <button
                        onClick={() => handleTransition('REJECTED', 'REJECTED')}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition"
                      >
                        Reject Claim
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-xs">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Select a claim from the pipeline</p>
                <p className="text-xs text-slate-500">Inspect AI forensic reasoning and manage state transitions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-AGENCY TRANSIT STATIONS & LOCKER ZONES */}
      {activeSubTab === 'hubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hubs.map((hub) => (
            <div key={hub.hubCode} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {hub.hubCode}
                    </span>
                    <span className="text-[10px] text-slate-500">{hub.agency}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{hub.name}</h3>
                  <p className="text-xs text-slate-500">{hub.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900">{hub.totalItemsStored}</span>
                  <span className="text-[10px] text-slate-500 block">Items in Custody</span>
                </div>
              </div>

              {/* Storage Zones Matrix */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-800 block">Zoning &amp; Locker Depository Banks:</span>
                <div className="space-y-1.5">
                  {hub.storageZones.map((z) => {
                    const percent = Math.round((z.occupiedCount / z.capacity) * 100);
                    return (
                      <div key={z.zoneCode} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{z.name}</span>
                          <span className="font-mono text-[11px] text-indigo-600 font-bold">
                            {z.occupiedCount}/{z.capacity} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent > 80 ? 'bg-rose-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
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
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Inter-Terminal Custody Transfer Manifests</h3>
                <p className="text-xs text-slate-500">Tamper-evident transport tracking across municipal agencies</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                Dual Badge Verification Enforced
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {transfers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No active transfer manifests.</div>
              ) : (
                transfers.map((m) => (
                  <div key={m.manifestId} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700">{m.manifestId}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            m.status === 'RECEIVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {m.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Seal: {m.tamperEvidentSealNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <span>{m.originHubName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{m.destinationHubName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{m.notes}</p>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 self-end sm:self-center">
                      <div>Dispatched by: <strong className="text-slate-900">{m.dispatchedByOfficerName}</strong> ({m.dispatchedByBadge})</div>
                      {m.receivedByOfficerName && (
                        <div>Received by: <strong className="text-emerald-700 font-bold">{m.receivedByOfficerName}</strong> ({m.receivedByBadge})</div>
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
