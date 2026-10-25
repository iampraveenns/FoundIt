import React, { useState } from 'react';
import {
  Layers,
  Box,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Shield,
  MapPin,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

interface LockerBin {
  id: string;
  bank: 'Bank A (Main Concourse)' | 'Bank B (Lower Concourse)' | 'Vault C (High Security)';
  status: 'AVAILABLE' | 'OCCUPIED' | 'SCHEDULED_PICKUP' | 'QUARANTINE';
  itemStored?: string;
  claimantName?: string;
  tamperSeal?: string;
  pinCode?: string;
  securityLevel: 'Standard' | 'High' | 'Biometric';
  lastAccessed: string;
}

const GENERATED_LOCKERS: LockerBin[] = Array.from({ length: 36 }, (_, i) => {
  const num = i + 1;
  const pad = num < 10 ? `0${num}` : `${num}`;

  if (num <= 12) {
    const isOccupied = [2, 5, 8, 11].includes(num);
    const isScheduled = [3, 9].includes(num);
    return {
      id: `A-${pad}`,
      bank: 'Bank A (Main Concourse)',
      status: isScheduled ? 'SCHEDULED_PICKUP' : isOccupied ? 'OCCUPIED' : 'AVAILABLE',
      itemStored: isScheduled ? 'Apple AirPods Pro 2 in MagSafe Case' : isOccupied ? 'Black Leather Laptop Briefcase' : undefined,
      claimantName: isScheduled ? 'Sarah Connor' : isOccupied ? 'Transit Custody' : undefined,
      tamperSeal: isOccupied || isScheduled ? `SEAL-NYC-${8800 + num}` : undefined,
      pinCode: isScheduled ? '841-902' : undefined,
      securityLevel: 'Standard',
      lastAccessed: '2 hours ago',
    };
  } else if (num <= 24) {
    const isOccupied = [14, 17, 21].includes(num);
    const isScheduled = [19].includes(num);
    return {
      id: `B-${pad}`,
      bank: 'Bank B (Lower Concourse)',
      status: isScheduled ? 'SCHEDULED_PICKUP' : isOccupied ? 'OCCUPIED' : 'AVAILABLE',
      itemStored: isScheduled ? 'Vintage Brown Leather Bifold Wallet' : isOccupied ? 'Ray-Ban Sunglasses & Case' : undefined,
      claimantName: isScheduled ? 'Marcus Vance' : isOccupied ? 'Transit Custody' : undefined,
      tamperSeal: isOccupied || isScheduled ? `SEAL-NYC-${9100 + num}` : undefined,
      pinCode: isScheduled ? '319-482' : undefined,
      securityLevel: 'Standard',
      lastAccessed: '4 hours ago',
    };
  } else {
    const isOccupied = [26, 29, 33, 35].includes(num);
    return {
      id: `V-${pad}`,
      bank: 'Vault C (High Security)',
      status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
      itemStored: isOccupied ? 'Rolex Submariner Watch (Vault Deposit)' : undefined,
      tamperSeal: isOccupied ? `VAULT-FED-${9900 + num}` : undefined,
      securityLevel: 'High',
      lastAccessed: '30 mins ago',
    };
  }
});

export default function LockerDepotMap() {
  const [lockers, setLockers] = useState<LockerBin[]>(GENERATED_LOCKERS);
  const [selectedLocker, setSelectedLocker] = useState<LockerBin | null>(lockers[2]); // Default A-03
  const [activeBankFilter, setActiveBankFilter] = useState<string>('All');

  const filtered = lockers.filter((l) => {
    if (activeBankFilter !== 'All' && !l.bank.includes(activeBankFilter)) return false;
    return true;
  });

  const counts = {
    total: lockers.length,
    available: lockers.filter((l) => l.status === 'AVAILABLE').length,
    occupied: lockers.filter((l) => l.status === 'OCCUPIED').length,
    scheduled: lockers.filter((l) => l.status === 'SCHEDULED_PICKUP').length,
  };

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Automated Locker Depository &bull; Grand Central Hub Grid
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time physical bin allocation, IoT unlock PIN generation, and custody seal tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-md bg-emerald-500" /> Available ({counts.available})
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-md bg-indigo-600" /> Stored ({counts.occupied})
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-md bg-amber-500" /> Pickup Ready ({counts.scheduled})
          </span>
        </div>
      </div>

      {/* Main Locker Grid & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 36-Bin Matrix */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Physical Locker Matrix (Grand Central Terminal)</h3>
            <div className="flex items-center gap-1.5 text-xs">
              {['All', 'Bank A', 'Bank B', 'Vault C'].map((b) => (
                <button
                  key={b}
                  onClick={() => setActiveBankFilter(b)}
                  className={`px-3 py-1 rounded-xl font-semibold transition ${
                    activeBankFilter === b
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
            {filtered.map((locker) => {
              const isSelected = selectedLocker?.id === locker.id;
              const isAvailable = locker.status === 'AVAILABLE';
              const isScheduled = locker.status === 'SCHEDULED_PICKUP';

              return (
                <button
                  key={locker.id}
                  onClick={() => setSelectedLocker(locker)}
                  className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-between min-h-[92px] shadow-xs cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-indigo-600 ring-offset-2 border-indigo-500 bg-indigo-50/50'
                      : isScheduled
                      ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                      : isAvailable
                      ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                      : 'bg-indigo-50/70 border-indigo-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-black text-slate-900">{locker.id}</span>
                    {isAvailable ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-2 ${
                      isScheduled
                        ? 'bg-amber-200/60 text-amber-900'
                        : isAvailable
                        ? 'bg-emerald-200/60 text-emerald-900'
                        : 'bg-indigo-200/60 text-indigo-900'
                    }`}
                  >
                    {isScheduled ? 'PICKUP' : locker.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Locker Inspector */}
        <div className="lg:col-span-4">
          {selectedLocker ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase block">
                    Locker Bin Dossier
                  </span>
                  <h3 className="text-lg font-black text-slate-900">Bin #{selectedLocker.id}</h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${
                    selectedLocker.status === 'SCHEDULED_PICKUP'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : selectedLocker.status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  {selectedLocker.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 text-[10px] block">Bank Location:</span>
                  <strong className="text-slate-900 block">{selectedLocker.bank}</strong>
                  <span className="text-slate-500 text-[10px] block pt-1">Security Rating:</span>
                  <span className="text-indigo-600 font-bold">{selectedLocker.securityLevel} Security</span>
                </div>

                {selectedLocker.itemStored && (
                  <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                      Currently Stored Property:
                    </span>
                    <strong className="text-slate-900 text-xs block">{selectedLocker.itemStored}</strong>
                    {selectedLocker.claimantName && (
                      <p className="text-[11px] text-slate-600">Assigned Claimant: {selectedLocker.claimantName}</p>
                    )}
                    {selectedLocker.tamperSeal && (
                      <div className="font-mono text-[11px] text-indigo-700 font-bold pt-1 border-t border-indigo-200/60">
                        Custody Seal: {selectedLocker.tamperSeal}
                      </div>
                    )}
                  </div>
                )}

                {selectedLocker.pinCode && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1 text-center">
                    <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider block">
                      Citizen Handover PIN (TOTP)
                    </span>
                    <span className="text-xl font-black font-mono text-slate-900 tracking-widest">
                      {selectedLocker.pinCode}
                    </span>
                    <span className="text-[10px] text-amber-600 block">Verified against Mobile Voucher</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Last Inspection:</span>
                  <strong className="text-slate-700">{selectedLocker.lastAccessed}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <Box className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Select a locker bin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
