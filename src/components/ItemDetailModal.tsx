import React from 'react';
import {
  X,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { FoundItem } from '../types.ts';

interface ItemDetailModalProps {
  item: FoundItem | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimClick: (item: FoundItem) => void;
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onClaimClick,
}: ItemDetailModalProps) {
  if (!isOpen || !item) return null;

  const [lng, lat] = item.location?.coordinates || [-73.97, 40.78];
  const isFound = item.status === 'found';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-6 text-slate-900">
        {/* Header Photo */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-100 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.itemName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/30" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 text-slate-700 hover:bg-white transition backdrop-blur-md shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
            <span className="px-3 py-1 bg-white/90 text-slate-800 text-xs font-semibold rounded-full border border-slate-200 backdrop-blur-md shadow-xs">
              {item.category}
            </span>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border backdrop-blur-md ${
                isFound
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'bg-emerald-600 text-white border-emerald-500'
              }`}
            >
              {item.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{item.itemName}</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
              <span>Color: <strong className="text-slate-800">{item.color}</strong></span>
              <span>&bull;</span>
              <span>Reported by: <strong className="text-slate-800">{item.reportedBy || 'Citizen'}</strong></span>
            </div>
          </div>

          {/* Location Box with GeoJSON 2dsphere details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                Geospatial 2dsphere Location
              </span>
              <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                GeoJSON Point
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900">{item.locationName}</p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-1 border-t border-slate-200">
              <span>Lat: {lat.toFixed(4)}</span>
              <span>Lng: {lng.toFixed(4)}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Visual Description &amp; Identifying Details
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {item.description}
            </p>
          </div>

          {/* AI Security Challenge Notice */}
          {item.claimQuestion && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 space-y-1">
              <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Owner Verification Challenge
              </span>
              <p className="text-xs text-indigo-950 italic">
                &ldquo;{item.claimQuestion}&rdquo;
              </p>
            </div>
          )}

          {item.searchTags && item.searchTags.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">Search Tags:</span>
              <div className="flex flex-wrap gap-1.5">
                {item.searchTags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Close
            </button>
            {isFound ? (
              <button
                onClick={() => {
                  onClose();
                  onClaimClick(item);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Verify Ownership &amp; Claim
              </button>
            ) : (
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                This item has been reclaimed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
