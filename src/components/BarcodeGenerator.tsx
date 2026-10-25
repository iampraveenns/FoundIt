import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  Tag,
  ShieldCheck,
  Building,
  Calendar,
  CheckCircle2,
  Copy,
} from 'lucide-react';

interface BarcodeGeneratorProps {
  initialItem?: {
    itemId: string;
    itemName: string;
    category: string;
    color: string;
    locationName: string;
    tamperSealNumber?: string;
  };
}

export default function BarcodeGenerator({
  initialItem = {
    itemId: 'item_1792829535277_9clpk',
    itemName: 'Apple Watch Series 9 (Midnight)',
    category: 'Electronics',
    color: 'Midnight Aluminum',
    locationName: 'Central Park Bethesda Fountain',
    tamperSealNumber: 'SEAL-NYC-99812',
  },
}: BarcodeGeneratorProps) {
  const [item, setItem] = useState(initialItem);
  const [stationName, setStationName] = useState('Grand Central Custody Depot');
  const [officerBadge, setOfficerBadge] = useState('TR-8942');
  const [sealNumber, setSealNumber] = useState(initialItem.tamperSealNumber || 'SEAL-NYC-99812');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Tag className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Municipal Property Evidence &bull; Barcode Tag Generator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate official adhesive barcode tags with Code-128 and 2D QR custody verification.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Adhesive Evidence Tag</span>
        </button>
      </div>

      {/* Main Tag Preview & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tag Customization Options */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Tag Parameters</h3>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Item Title</label>
            <input
              type="text"
              value={item.itemName}
              onChange={(e) => setItem({ ...item, itemName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <input
                type="text"
                value={item.category}
                onChange={(e) => setItem({ ...item, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Color / Finish</label>
              <input
                type="text"
                value={item.color}
                onChange={(e) => setItem({ ...item, color: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tamper-Evident Seal Serial</label>
            <input
              type="text"
              value={sealNumber}
              onChange={(e) => setSealNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700 font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Custody Depot</label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Officer Badge #</label>
              <input
                type="text"
                value={officerBadge}
                onChange={(e) => setOfficerBadge(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Printable Physical Tag Sheet */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-md space-y-4 font-mono text-xs text-slate-950">
            {/* Tag Header */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase block">
                  NYC MUNICIPAL TRANSIT AUTHORITY
                </span>
                <strong className="text-sm font-black">PROPERTY &amp; EVIDENCE CUSTODY TAG</strong>
              </div>
              <span className="text-xl font-black">🏛️</span>
            </div>

            {/* Item Information */}
            <div className="space-y-1 text-[11px]">
              <div>Item: <strong className="text-xs uppercase">{item.itemName}</strong></div>
              <div>Category: <strong>{item.category}</strong> &bull; Color: <strong>{item.color}</strong></div>
              <div>Intake Depot: <strong>{stationName}</strong></div>
              <div>Date Sealed: <strong>{new Date().toLocaleDateString()}</strong> &bull; Badge: <strong>{officerBadge}</strong></div>
            </div>

            {/* Code 128 Barcode Simulation */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-center space-y-1">
              <div className="h-14 flex items-center justify-center gap-0.5 overflow-hidden">
                {Array.from({ length: 48 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-full bg-slate-950"
                    style={{ width: `${(idx % 4 === 0 || idx % 7 === 0) ? 3 : 1.5}px` }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-mono tracking-widest font-black block">
                *{sealNumber}*
              </span>
            </div>

            {/* QR Code and Tamper Seal Ribbon */}
            <div className="flex items-center justify-between pt-2 border-t-2 border-slate-900">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-600 block">TAMPER-EVIDENT SEAL:</span>
                <span className="text-sm font-black text-slate-900">{sealNumber}</span>
                <span className="text-[9px] text-slate-500 block">Scan QR to verify chain on blockchain</span>
              </div>

              <div className="w-16 h-16 bg-slate-950 p-1.5 rounded-xl flex items-center justify-center">
                <svg className="w-full h-full text-white" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM40 30h10v10H40zM60 40h10v10H60zM40 60h10v10H40zM70 70h20v20H70z" />
                </svg>
              </div>
            </div>

            {/* Officer Signature Line */}
            <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600">
              <span>Custody Officer: _______________________</span>
              <span>Status: SEALED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
