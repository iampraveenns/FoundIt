import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Radio,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
} from 'lucide-react';

/**
 * Format relative time (e.g. "2m ago", "1h ago")
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  const now = Date.now();
  const date = new Date(timestamp).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

/**
 * Helper to play gentle UI chime when a real-time event is received
 */
function playLiveChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    // AudioContext might be blocked until user gesture
  }
}

const CATEGORIES = [
  'All',
  'Electronics',
  'Bags & Wallets',
  'Keys & Badges',
  'Eyewear',
  'Clothing & Accessories',
  'Documents & Cards',
  'Other',
];

export default function LiveFeed({ onSelectItem, onClaimClick }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newArrivalAlert, setNewArrivalAlert] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const socketRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Fetch initial items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    // Initialize Socket.io connection to the same origin
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[LiveFeed] Connected to Socket.io real-time feed');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[LiveFeed] Disconnected from Socket.io');
    });

    // Listen for newly reported found items broadcasted in real-time
    socket.on('item:found', (newItem) => {
      console.log('[LiveFeed] Real-time item received:', newItem);
      setItems((prev) => {
        // Avoid duplicate insertion
        if (prev.some((item) => (item._id || item.id) === (newItem._id || newItem.id))) {
          return prev;
        }
        return [newItem, ...prev];
      });

      // Show temporary arrival banner
      setNewArrivalAlert(newItem);
      setTimeout(() => {
        setNewArrivalAlert(null);
      }, 5000);

      // Audio notification
      if (soundEnabledRef.current) {
        playLiveChime();
      }
    });

    // Listen for status updates (e.g. claimed or returned)
    socket.on('item:updated', (updatedItem) => {
      setItems((prev) =>
        prev.map((item) =>
          (item._id || item.id) === (updatedItem._id || updatedItem.id) ? updatedItem : item
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Filter items based on user criteria
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter;
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.itemName.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.locationName.toLowerCase().includes(q) ||
      (item.searchTags && item.searchTags.some((tag) => tag.toLowerCase().includes(q)));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              )}
            </span>
            <h2 className="text-xl font-bold tracking-tight">Real-Time Lost &amp; Found Feed</h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {isConnected ? 'LIVE WEBSOCKET' : 'CONNECTING...'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            New found items broadcast instantly across all connected devices via Socket.io.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title={soundEnabled ? 'Mute alert sound' : 'Unmute alert sound'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Alert Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>Alert Audio Off</span>
              </>
            )}
          </button>

          <button
            onClick={fetchItems}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Real-time Banner Alert on new arrival */}
      {newArrivalAlert && (
        <div className="animate-bounce bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between border border-emerald-400/40">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                Just Reported Live!
              </p>
              <p className="font-bold text-sm">
                {newArrivalAlert.itemName} &bull; {newArrivalAlert.locationName}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectItem && onSelectItem(newArrivalAlert)}
            className="px-3 py-1.5 bg-white text-emerald-900 rounded-lg text-xs font-bold hover:bg-emerald-50 transition"
          >
            Inspect Item
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Quick text filter */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Quick filter live items by keyword, brand, color, location..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            {['All', 'found', 'claimed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {st === 'All' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-2xl h-80 animate-pulse p-4 space-y-4"
            >
              <div className="bg-slate-800 h-44 rounded-xl w-full" />
              <div className="bg-slate-800 h-4 rounded w-3/4" />
              <div className="bg-slate-800 h-3 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No items match criteria</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try resetting your filters or report a new found item to see the real-time broadcast in
            action.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setStatusFilter('All');
              setSearchFilter('');
            }}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isFound = item.status === 'found';
            return (
              <div
                key={item._id || item.id}
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Image Container with Badge Overlays */}
                  <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Category Pill */}
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-700/60 shadow">
                      {item.category}
                    </div>

                    {/* Status Pill */}
                    <div
                      className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full border shadow backdrop-blur-md ${
                        isFound
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </div>

                    {/* AI Confidence Indicator */}
                    {item.aiConfidence && (
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-[10px] text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/30">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        AI Verified ({Math.round(item.aiConfidence * 100)}%)
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {item.itemName}
                      </h3>
                    </div>

                    {/* Time & Color */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>
                        {item.color}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item.locationName}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Search Tags */}
                    {item.searchTags && item.searchTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.searchTags.slice(0, 4).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/40">
                  <button
                    onClick={() => onSelectItem && onSelectItem(item)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition text-center"
                  >
                    Details &amp; Radar
                  </button>

                  {isFound ? (
                    <button
                      onClick={() => onClaimClick && onClaimClick(item)}
                      className="py-2 px-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-sm flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Claim This
                    </button>
                  ) : (
                    <span className="py-2 px-3 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Reunited
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
