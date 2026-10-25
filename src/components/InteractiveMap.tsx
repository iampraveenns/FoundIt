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
  Electronics: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Bags & Wallets': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Keys & Badges': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  Eyewear: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Clothing & Accessories': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Sports & Outdoor': { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  Other: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
};

export default function InteractiveMap({ items, onSelectItem, onClaimClick }: InteractiveMapProps) {
  // Center coordinates (e.g. Midtown Manhattan)
  const [centerLat, setCenterLat] = useState(40.7580);
  const [centerLng, setCenterLng] = useState(-73.9855);
  const [zoom, setZoom] = useState(1); // 0.8 to 2.5
  const [radiusKm, setRadiusKm] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'found' | 'claimed'>('All');
  const [mapTheme, setMapTheme] = useState<'light' | 'transit' | 'satellite'>('light');
  const [hoveredItem, setHoveredItem] = useState<FoundItem | null>(null);

  // Compute items relative coordinates and distance from user center
  const itemsWithDistance = useMemo(() => {
    return items.map((item) => {
      const [lng, lat] = item.location?.coordinates || [-73.98, 40.75];
      const dist = calculateDistanceKm(centerLat, centerLng, lat, lng);
      // Planar projection coordinates in pixels centered at (400, 300)
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

  // Dynamic Clustering: Group items that are closer than 36px on the current zoom level
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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2 text-slate-900">
              Geospatial Cluster Radar
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                {filteredItems.length} active in view
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Interactive 2dsphere proximity mapping with dynamic marker clustering
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Radius Slider */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-600">Radius:</span>
            <strong className="text-xs text-indigo-600 font-bold w-12">{radiusKm} km</strong>
            <input
              type="range"
              min="2"
              max="40"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['All', 'found', 'claimed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize transition ${
                  statusFilter === st ? 'bg-indigo-600 text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Theme switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setMapTheme('light')}
              className={`px-2.5 py-1 rounded-lg ${mapTheme === 'light' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'}`}
            >
              Light
            </button>
            <button
              onClick={() => setMapTheme('transit')}
              className={`px-2.5 py-1 rounded-lg ${mapTheme === 'transit' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'}`}
            >
              Transit
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              className={`px-2.5 py-1 rounded-lg ${mapTheme === 'satellite' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'}`}
            >
              Terrain
            </button>
          </div>

          {/* Center on GPS */}
          <button
            onClick={handleUseCurrentGPS}
            title="Recenter on your GPS location"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-600 border border-slate-200 transition"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[520px] bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-xs select-none">
        {/* Background Map Graphic Styling */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            mapTheme === 'satellite'
              ? 'opacity-40 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:16px_16px]'
              : mapTheme === 'transit'
              ? 'opacity-50 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] [background-size:32px_32px]'
              : 'opacity-40 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px]'
          }`}
        />

        {/* SVG Roads & Transit Grid Layers */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-300">
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
            stroke="rgba(99, 102, 241, 0.25)"
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
            <div className="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
          <span className="mt-1 px-2 py-0.5 bg-white/95 text-[10px] font-bold text-indigo-700 rounded-full border border-indigo-200 shadow-2xs">
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md border-2 border-white">
              +{cluster.items.length}
            </div>
            <div className="hidden group-hover:flex absolute bottom-11 left-1/2 -translate-x-1/2 bg-white text-slate-800 text-[10px] px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap shadow-lg z-30">
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
                className={`p-1.5 rounded-full border shadow-md flex items-center justify-center transition-all ${
                  isFound
                    ? 'bg-amber-500 border-white text-white'
                    : 'bg-emerald-600 border-white text-white'
                }`}
              >
                <MapPin className="w-4 h-4 fill-current stroke-white" />
              </div>

              {/* Pin tooltip badge */}
              <div className="hidden group-hover:flex absolute bottom-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 text-slate-900 rounded-xl p-2.5 shadow-xl z-40 w-48 flex-col gap-1.5 pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${catStyle.dot}`} />
                  <span className="text-[10px] text-slate-500">{item.category}</span>
                </div>
                <h4 className="text-xs font-bold truncate leading-tight text-slate-900">{item.itemName}</h4>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>{item.distanceKm} km away</span>
                  <span className={`font-semibold capitalize ${isFound ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-5 right-5 z-30 flex flex-col gap-1.5 bg-white/95 border border-slate-200 rounded-xl p-1 shadow-md backdrop-blur-md">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.6))}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Active Inspection Card on hover or pin click */}
        {hoveredItem && (
          <div className="absolute top-4 left-4 z-30 max-w-sm bg-white/95 border border-slate-200 rounded-2xl p-3.5 shadow-xl backdrop-blur-md flex items-center gap-3 text-slate-900 animate-fade-in">
            <img
              src={hoveredItem.imageUrl}
              alt={hoveredItem.itemName}
              className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-indigo-600 block tracking-wider">
                {hoveredItem.category} &bull; {hoveredItem.distanceKm} km away
              </span>
              <h4 className="text-xs font-bold truncate text-slate-900">{hoveredItem.itemName}</h4>
              <p className="text-[11px] text-slate-500 truncate">{hoveredItem.locationName}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => onSelectItem(hoveredItem)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700 rounded-lg border border-slate-200"
                >
                  Inspect
                </button>
                {hoveredItem.status === 'found' && onClaimClick && (
                  <button
                    onClick={() => onClaimClick(hoveredItem)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white rounded-lg flex items-center gap-1 shadow-2xs"
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
