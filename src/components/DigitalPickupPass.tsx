import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ShieldCheck,
  MapPin,
  Clock,
  Download,
  CheckCircle2,
  Lock,
  Building,
  Key,
  Smartphone,
  Printer,
  X,
  Copy,
  Sparkles,
} from 'lucide-react';

interface DigitalPickupPassProps {
  claimData?: {
    claimId: string;
    itemName: string;
    category: string;
    claimantName: string;
    claimantEmail: string;
    assignedHubName?: string;
    assignedHubAddress?: string;
    pickupLockerBin?: string;
    tamperSealNumber?: string;
  };
  onClose?: () => void;
}

export default function DigitalPickupPass({
  claimData = {
    claimId: 'CLAIM-2026-8819',
    itemName: 'Apple AirPods Pro (2nd Gen) in MagSafe Case',
    category: 'Electronics',
    claimantName: 'Sarah Connor',
    claimantEmail: 'sarah@citizen.org',
    assignedHubName: 'Grand Central Terminal Central Hub',
    assignedHubAddress: '89 E 42nd St, Lower Concourse, New York, NY 10017',
    pickupLockerBin: 'LOCKER-CONCOURSE-A14',
    tamperSealNumber: 'SEAL-NYC-99812',
  },
  onClose,
}: DigitalPickupPassProps) {
  const [totp, setTotp] = useState('841-902');
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [copied, setCopied] = useState(false);

  // Cycling TOTP security token
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          const newCode = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
          setTotp(newCode);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(totp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white relative">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
                Official Custody Handover Pass
              </span>
              <h3 className="text-base font-extrabold leading-tight">Digital Municipal Voucher</h3>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Voucher Body */}
        <div className="p-6 space-y-5">
          {/* Item & Claimant Card */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase block">
              Verified Item Claim &bull; {claimData.claimId}
            </span>
            <h4 className="text-sm font-bold text-white">{claimData.itemName}</h4>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Owner: <strong className="text-slate-200">{claimData.claimantName}</strong></span>
              <span className="font-mono text-emerald-400 font-bold">VERIFIED</span>
            </div>
          </div>

          {/* QR Code & Rolling TOTP Screen */}
          <div className="bg-white p-5 rounded-3xl text-center space-y-3 shadow-inner">
            <div className="w-44 h-44 mx-auto bg-slate-950 p-2.5 rounded-2xl flex items-center justify-center relative shadow-lg">
              {/* High-fidelity SVG QR representation */}
              <svg className="w-full h-full text-white" viewBox="0 0 100 100" fill="currentColor">
                <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM35 10h5v5h-5zM45 5h10v5h-10zM60 15h5v10h-5zM35 25h10v5h-10zM35 35h5v5h-5zM50 35h15v5h-15zM75 35h15v5h-15zM20 45h15v5h-15zM45 45h5v10h-5zM60 45h10v5h-10zM80 45h10v10h-10zM10 55h5v15h-5zM25 60h10v5h-10zM50 60h5v10h-5zM65 60h15v5h-15zM35 75h15v5h-15zM60 75h5v15h-5zM75 75h10v5h-10zM40 85h10v10h-10zM75 85h15v10h-15z" />
              </svg>
              <div className="absolute inset-0 border-2 border-indigo-500 rounded-2xl pointer-events-none opacity-40 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                Time-Based One-Time Handover Code (TOTP)
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black font-mono tracking-widest text-slate-900">{totp}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded text-slate-500 hover:text-indigo-600 transition"
                  title="Copy OTP"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>Expires in <strong className="text-indigo-600">{secondsRemaining}s</strong> (Auto-cycles)</span>
              </div>
            </div>
          </div>

          {/* Location & Locker Bank Coordinates */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">{claimData.assignedHubName}</strong>
                <p className="text-[11px] text-slate-400">{claimData.assignedHubAddress}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 text-[11px]">Locker Bin:</span>
                <strong className="text-indigo-400 font-mono text-[11px]">{claimData.pickupLockerBin}</strong>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Seal: {claimData.tamperSealNumber}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition flex items-center justify-center gap-2 border border-slate-700 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for Pickup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
