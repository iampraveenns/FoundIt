import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { FoundItem, SearchResultResponse } from '../types.ts';

const SAMPLE_SEARCH_PROMPTS = [
  'Lost brown leather wallet with transit card near Grand Central',
  'I dropped my AirPods in a white case with a strap in Central Park',
  'Looking for navy blue backpack left at a cafe table',
  'Car key fob on titanium ring with red Swiss Army pocket knife',
  'Tortoiseshell sunglasses left near high line overlook',
];

interface SmartSearchProps {
  onSelectItem?: (item: FoundItem) => void;
  onClaimClick?: (item: FoundItem) => void;
}

export default function SmartSearch({ onSelectItem, onClaimClick }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [useLocation, setUseLocation] = useState(true);
  const [userLat] = useState('40.7580'); // Center Manhattan
  const [userLng] = useState('-73.9855');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultResponse | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a description of what you lost.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload: { query: string; radiusKm: number; lat?: number; lng?: number } = {
        query: query.trim(),
        radiusKm: Number(radiusKm),
      };

      if (useLocation && userLat && userLng) {
        payload.lat = Number(userLat);
        payload.lng = Number(userLng);
      }

      const res = await fetch('/api/items/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Search error:', msg);
      setError(msg || 'Failed to search items');
    } finally {
      setIsLoading(false);
    }
  };

  const setPrompt = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Gemini Semantic Neural Matcher
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Find What You Lost Using Natural Language
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Describe your lost item in your own words. Our Gemini 3.8 Flash model understands semantic
            synonyms, visual details, brand nicknames, and location proximity to find your belongings.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="mt-6 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. 'I lost my brown leather bifold wallet with my university metrocard near the library yesterday around noon'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-32 py-4 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Matching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>AI Match</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Examples */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-slate-400 font-medium">Try asking:</span>
            {SAMPLE_SEARCH_PROMPTS.map((prompt, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setPrompt(prompt)}
                className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/60 transition"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>

          {/* Location & Radius Slider */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="checkbox"
                id="useLoc"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
              />
              <label htmlFor="useLoc" className="text-xs text-slate-300 font-medium flex items-center gap-1.5 cursor-pointer">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Enable 2dsphere Proximity Radar (Center Manhattan)
              </label>
            </div>

            {useLocation && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  Radius: <strong className="text-white">{radiusKm} km</strong>
                </span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Results Display */}
      {isLoading && (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-white">Gemini 3.8 Flash Analyzing Matches</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Computing semantic vector intent, comparing colors, visual tags, spatial distance, and evaluating candidate probability...
          </p>
        </div>
      )}

      {!isLoading && searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-white px-1">
            <div>
              <h3 className="text-lg font-bold">
                {searchResults.matchesCount ?? searchResults.items.length} Matches Found
              </h3>
              <p className="text-xs text-slate-400">
                Sorted by AI Semantic Match Score for: &ldquo;{searchResults.query}&rdquo;
              </p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 font-medium">
              Gemini Vision &amp; Semantics
            </span>
          </div>

          {searchResults.items.length === 0 ? (
            <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No matching items found</p>
              <p className="text-xs mt-1">Try broadening your search terms or increasing the location radius.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.items.map((item: FoundItem, idx: number) => {
                const score = item.matchScore ?? 50;
                const isHigh = score >= 75;
                const isMedium = score >= 50 && score < 75;

                return (
                  <div
                    key={item._id || item.id || idx}
                    className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all ${
                      item.isTopMatch || isHigh
                        ? 'border-indigo-500/70 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/20'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-5 items-start">
                      {/* Image Thumbnail */}
                      <div className="relative w-full md:w-48 h-40 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-[11px] font-semibold text-slate-200 px-2 py-0.5 rounded-full border border-slate-700">
                          {item.category}
                        </div>
                      </div>

                      {/* Content & Match Reasoning */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-lg font-bold text-white leading-tight">
                            {item.itemName}
                          </h4>

                          {/* Match Score Gauge */}
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${
                              isHigh
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isMedium
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{score}% Match</span>
                          </div>
                        </div>

                        {/* Gemini Reasoning Callout */}
                        {item.matchReason && (
                          <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-200 space-y-1">
                            <span className="font-semibold text-indigo-300 block">
                              AI Match Assessment:
                            </span>
                            <p className="leading-relaxed text-indigo-100">{item.matchReason}</p>
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            {item.locationName}
                          </span>
                          {item.distanceKm !== undefined && (
                            <span className="text-slate-300 font-medium">
                              ({item.distanceKm} km away)
                            </span>
                          )}
                          <span>&bull;</span>
                          <span>Color: {item.color}</span>
                        </div>

                        {/* Matching points badges */}
                        {item.matchingAttributes && item.matchingAttributes.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-400">Match factors:</span>
                            {item.matchingAttributes.map((attr: string, aIdx: number) => (
                              <span
                                key={aIdx}
                                className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md"
                              >
                                &check; {attr}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          {onSelectItem && (
                            <button
                              onClick={() => onSelectItem(item)}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition"
                            >
                              View Details
                            </button>
                          )}
                          {item.status === 'found' ? (
                            onClaimClick && (
                              <button
                                onClick={() => onClaimClick(item)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl transition shadow flex items-center gap-1.5"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                This is Mine (Claim)
                              </button>
                            )
                          ) : (
                            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Already Claimed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
