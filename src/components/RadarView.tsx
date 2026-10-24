import React, { useState } from 'react';
import { Compass } from 'lucide-react';
import { calculateDistanceKm } from '../utils/geo.ts';
import { FoundItem } from '../types.ts';

interface RadarViewProps {
  items: FoundItem[];
  onSelectItem: (item: FoundItem) => void;
  onClaimClick?: (item: FoundItem) => void;
}

interface ItemWithRadarCoords extends FoundItem {
  distKm: number;
  angleRad: number;
  dx: number;
  dy: number;
}

export default function RadarView({ items = [], onSelectItem }: RadarViewProps) {
  const [centerLat] = useState(40.7580); // NYC Midtown
  const [centerLng] = useState(-73.9855);
  const [rangeKm, setRangeKm] = useState(15);
  const [hoveredItem, setHoveredItem] = useState<ItemWithRadarCoords | null>(null);

  // Compute items with distances and polar projection for radar plotting
  const itemsWithDistance: ItemWithRadarCoords[] = items.map((item) => {
    const [lng, lat] = item.location?.coordinates || [-73.98, 40.75];
    const dist = calculateDistanceKm(centerLat, centerLng, lat, lng);
    // Rough planar projection angle from center
    const dLat = (lat - centerLat) * 111;
    const dLng = (lng - centerLng) * 85;
    const angleRad = Math.atan2(dLat, dLng);
    return {
      ...item,
      distKm: dist,
      angleRad,
      dx: dLng,
      dy: dLat,
    };
  });

  const withinRange = itemsWithDistance.filter((i) => i.distKm <= rangeKm);

  return (
    <div className="space-y-6">
      {/* Radar Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">2dsphere Geospatial Radar</h2>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
              MongoDB 2dsphere
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing found items plotted relative to center coordinates ({centerLat.toFixed(2)}, {centerLng.toFixed(2)}).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-slate-300 font-medium whitespace-nowrap">
            Radar Sweep: <strong className="text-indigo-400">{rangeKm} km</strong>
          </label>
          <input
            type="range"
            min="2"
            max="30"
            value={rangeKm}
            onChange={(e) => setRangeKm(Number(e.target.value))}
            className="w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      {/* Main Radar Screen & Details Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Radar Scope */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex items-center justify-center min-h-[460px] shadow-inner">
          {/* Circular Radar Grid */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-emerald-500/30 flex items-center justify-center">
            {/* Range Rings */}
            <div className="absolute inset-8 rounded-full border border-dashed border-emerald-500/20" />
            <div className="absolute inset-20 rounded-full border border-dashed border-emerald-500/20" />
            <div className="absolute inset-32 rounded-full border border-emerald-500/30" />

            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/20" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-500/20" />

            {/* Rotating Radar Sweep Line */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, transparent 315deg, rgba(16, 185, 129, 0.15) 360deg)',
                animation: 'spin 5s linear infinite',
              }}
            />

            {/* Center Origin Beacon */}
            <div className="relative z-10 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <div className="w-2 h-2 bg-white rounded-full" />
              <div className="absolute -bottom-5 text-[10px] font-bold text-indigo-300 uppercase whitespace-nowrap">
                You (Center)
              </div>
            </div>

            {/* Plotted Found Items */}
            {withinRange.map((item) => {
              const rNorm = Math.min(item.distKm / rangeKm, 1);
              const rPx = rNorm * 160;
              const xPos = Math.cos(item.angleRad) * rPx;
              const yPos = -Math.sin(item.angleRad) * rPx;
              const isFound = item.status === 'found';

              return (
                <div
                  key={item._id || item.id}
                  style={{
                    transform: `translate(${xPos}px, ${yPos}px)`,
                  }}
                  onMouseEnter={() => setHoveredItem(item)}
                  onClick={() => onSelectItem && onSelectItem(item)}
                  className="absolute cursor-pointer group z-20 transition-transform duration-200"
                >
                  <div
                    className={`relative w-4 h-4 rounded-full flex items-center justify-center transition-transform hover:scale-150 ${
                      isFound
                        ? 'bg-amber-400 shadow-md shadow-amber-400/50'
                        : 'bg-emerald-400 shadow-md shadow-emerald-400/50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                    {/* Hover tooltip */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                      <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-slate-700 whitespace-nowrap shadow-xl">
                        {item.itemName} ({item.distKm} km)
                      </div>
                      <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compass labels */}
          <span className="absolute top-3 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-emerald-400">
            N
          </span>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-emerald-500/60">
            S
          </span>
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-500/60">
            W
          </span>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-500/60">
            E
          </span>
        </div>

        {/* Radar Targets Inspector List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Detected Items ({withinRange.length})
              </h3>
              <span className="text-xs text-slate-400">Within {rangeKm} km</span>
            </div>

            <div className="space-y-3 mt-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {withinRange.map((item) => (
                <div
                  key={item._id || item.id}
                  onClick={() => onSelectItem && onSelectItem(item)}
                  className={`p-3 rounded-2xl border cursor-pointer transition ${
                    hoveredItem && (hoveredItem._id || hoveredItem.id) === (item._id || item.id)
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.itemName}
                      className="w-12 h-12 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white truncate">{item.itemName}</h4>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {item.distKm} km
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.locationName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            item.status === 'found' ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
            Click any pin on the radar screen to inspect details or claim the item.
          </div>
        </div>
      </div>
    </div>
  );
}
