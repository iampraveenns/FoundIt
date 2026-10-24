import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { calculateDistanceKm } from '../utils/geo.ts';
import { FoundItem } from '../types.ts';

interface InteractiveMapProps {
  items: FoundItem[];
  onSelectItem: (item: FoundItem) => void;
  onClaimClick?: (item: FoundItem) => void;
}

// Category styling
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Electronics: { bg: 'bg-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400' },
  'Bags & Wallets': { bg: 'bg-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-400' },
  'Keys & Badges': { bg: 'bg-rose-500/20', text: 'text-rose-300', dot: 'bg-rose-400' },
  Eyewear: { bg: 'bg-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400' },
  'Clothing & Accessories': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  'Sports & Outdoor': { bg: 'bg-teal-500/20', text: 'text-teal-300', dot: 'bg-teal-400' },
  Other: { bg: 'bg-slate-500/20', text: 'text-slate-300', dot: 'bg-slate-400' },
};

export default function InteractiveMap({ items, onSelectItem, onClaimClick }: InteractiveMapProps) {
  // Center coordinates (e.g. Midtown Manhattan)
  const [centerLat, setCenterLat] = useState(40.7580);
  const [centerLng, setCenterLng] = useState(-73.9855);
  const [zoom, setZoom] = useState(1); // 0.8 to 2.5
  const [radiusKm, setRadiusKm] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'found' | 'claimed'>('All');
  const [mapTheme, setMapTheme] = useState<'dark' | 'satellite' | 'transit'>('dark');
  const [hoveredItem, setHoveredItem] = useState<FoundItem | null>(null);

  // Compute items relative coordinates and distance from user center
  const itemsWithDistance = useMemo(() => {
    return items.map((item) => {
      const [lng, lat] = item.location?.coordinates || [-73.98, 40.75];
      const dist = calculateDistanceKm(centerLat, centerLng, lat, lng);
      // Rough planar projection coordinates in pixels centered at (400, 300)
      // 1 deg lat ≈ 111km, 1 deg lng ≈ 85km at 40 deg lat
      const xOffset = (lng - centerLng) * 85 * 25 * zoom;
      const yOffset = -(lat - centerLat) * 111 * 25 * zoom;
      return {
        ...item,
        distanceKm: dist,
        mapX: 400 + xOffset,
        mapY: 300 + yOffset,
      };
    });
  }, [items, centerLat, centerLng, zoom]);

  // Filter items by radius and category
  const filteredItems = useMemo(() => {
    return itemsWithDistance.filter((item) => {
      const withinRadius = item.distanceKm <= radiusKm;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return withinRadius && matchesCategory && matchesStatus;
    });
  }, [itemsWithDistance, radiusKm, selectedCategory, statusFilter]);

  // Dynamic Clustering: Group items that are closer than 35px on the current zoom level
  const { clusters, unclustered } = useMemo(() => {
    const clusterRadiusPx = 36;
    const visited = new Set<string>();
    const cList: { id: string; x: number; y: number; items: typeof filteredItems }[] = [];
    const uList: typeof filteredItems = [];

    for (let i = 0; i < filteredItems.length; i++) {
      const item = filteredItems[i];
      const itemId = item._id || item.id || `idx_${i}`;
      if (visited.has(itemId)) continue;

      const group = [item];
      for (let j = i + 1; j < filteredItems.length; j++) {
        const other = filteredItems[j];
        const otherId = other._id || other.id || `idx_${j}`;
        if (visited.has(otherId)) continue;

        const dx = item.mapX - other.mapX;
        const dy = item.mapY - other.mapY;
        const distPx = Math.sqrt(dx * dx + dy * dy);

        if (distPx < clusterRadiusPx) {
          group.push(other);
          visited.add(otherId);
        }
      }

      if (group.length > 1) {
        visited.add(itemId);
        // Average coordinates for cluster badge
        const avgX = group.reduce((acc, curr) => acc + curr.mapX, 0) / group.length;
        const avgY = group.reduce((acc, curr) => acc + curr.mapY, 0) / group.length;
        cList.push({
          id: `cluster_${i}`,
          x: avgX,
          y: avgY,
          items: group,
        });
      } else {
        uList.push(item);
      }
    }

    return { clusters: cList, unclustered: uList };
  }, [filteredItems]);

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenterLat(pos.coords.latitude);
          setCenterLng(pos.coords.longitude);
        },
        (err) => {
          console.warn('GPS location request notice:', err.message);
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Map Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              Geospatial Cluster Radar
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                {filteredItems.length} active in view
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 2dsphere proximity mapping with dynamic marker clustering
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Radius Slider */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300">Radius:</span>
            <strong className="text-xs text-indigo-400 font-bold w-12">{radiusKm} km</strong>
            <input
              type="range"
              min="2"
              max="40"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
            {(['All', 'found', 'claimed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize transition ${
                  statusFilter === st ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Theme switcher */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2 py-1 rounded-lg ${mapTheme === 'dark' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapTheme('transit')}
              className={`px-2 py-1 rounded-lg ${mapTheme === 'transit' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
            >
              Transit
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              className={`px-2 py-1 rounded-lg ${mapTheme === 'satellite' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
            >
              Satellite
            </button>
          </div>

          {/* Center on GPS */}
          <button
            onClick={handleUseCurrentGPS}
            title="Recenter on your GPS location"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[520px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl select-none">
        {/* Background Map Graphic Styling */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            mapTheme === 'satellite'
              ? 'opacity-30 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]'
              : mapTheme === 'transit'
              ? 'opacity-40 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] [background-size:32px_32px]'
              : 'opacity-25 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]'
          }`}
        />

        {/* SVG Roads & Transit Grid Layers */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-800/80">
          <line x1="0" y1="300" x2="800" y2="300" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="400" y1="0" x2="400" y2="600" strokeWidth="2" strokeDasharray="4 4" />

          {/* Concentric Proximity Radius Circles */}
          <circle
            cx="400"
            cy="300"
            r={radiusKm * 10 * zoom}
            fill="rgba(99, 102, 241, 0.05)"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="transition-all duration-300"
          />
          <circle
            cx="400"
            cy="300"
            r={(radiusKm * 10 * zoom) / 2}
            fill="none"
            stroke="rgba(99, 102, 241, 0.2)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Center GPS / User Beacon */}
        <div
          style={{ left: '400px', top: '300px' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center"
        >
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-indigo-400 opacity-60" />
            <div className="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
          <span className="mt-1 px-2 py-0.5 bg-slate-900/90 text-[10px] font-bold text-indigo-300 rounded-full border border-indigo-500/40 shadow">
            Search Center
          </span>
        </div>

        {/* Clustered Marker Badges */}
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            style={{ left: `${cluster.x}px`, top: `${cluster.y}px` }}
            onClick={() => setZoom((z) => Math.min(z + 0.4, 2.5))}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer group transition-transform hover:scale-115"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-extrabold text-xs flex items-center justify-center shadow-lg border-2 border-white/80">
              +{cluster.items.length}
            </div>
            <div className="hidden group-hover:flex absolute bottom-11 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-lg border border-slate-700 whitespace-nowrap shadow-xl z-30">
              Cluster of {cluster.items.length} items &bull; Click to zoom in
            </div>
          </div>
        ))}

        {/* Individual Item Map Markers */}
        {unclustered.map((item) => {
          const isFound = item.status === 'found';
          const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;

          return (
            <div
              key={item._id || item.id}
              style={{ left: `${item.mapX}px`, top: `${item.mapY}px` }}
              onMouseEnter={() => setHoveredItem(item)}
              onClick={() => onSelectItem(item)}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-transform duration-200 hover:scale-125"
            >
              <div
                className={`p-1.5 rounded-full border shadow-xl flex items-center justify-center transition-all ${
                  isFound
                    ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-amber-500/40'
                    : 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-emerald-500/40'
                }`}
              >
                <MapPin className="w-4 h-4 fill-current stroke-slate-950" />
              </div>

              {/* Pin tooltip badge */}
              <div className="hidden group-hover:flex absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 shadow-2xl z-40 w-48 flex-col gap-1.5 pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${catStyle.dot}`} />
                  <span className="text-[10px] text-slate-400">{item.category}</span>
                </div>
                <h4 className="text-xs font-bold truncate leading-tight">{item.itemName}</h4>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>{item.distanceKm} km away</span>
                  <span className={`font-semibold capitalize ${isFound ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-5 right-5 z-30 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.6))}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Active Inspection Card on hover or pin click */}
        {hoveredItem && (
          <div className="absolute top-4 left-4 z-30 max-w-sm bg-slate-900/95 border border-slate-700 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3 text-white animate-fade-in">
            <img
              src={hoveredItem.imageUrl}
              alt={hoveredItem.itemName}
              className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                {hoveredItem.category} &bull; {hoveredItem.distanceKm} km away
              </span>
              <h4 className="text-xs font-bold truncate text-white">{hoveredItem.itemName}</h4>
              <p className="text-[11px] text-slate-400 truncate">{hoveredItem.locationName}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => onSelectItem(hoveredItem)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-200 rounded-lg"
                >
                  Inspect
                </button>
                {hoveredItem.status === 'found' && onClaimClick && (
                  <button
                    onClick={() => onClaimClick(hoveredItem)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white rounded-lg flex items-center gap-1 shadow"
                  >
                    <ShieldCheck className="w-3 h-3" /> Claim
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
