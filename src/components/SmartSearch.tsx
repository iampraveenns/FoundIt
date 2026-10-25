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
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-100 rounded-3xl p-6 sm:p-8 shadow-xs text-slate-900">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Gemini Semantic Neural Matcher
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Find What You Lost Using Natural Language
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
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
              className="w-full pl-12 pr-32 py-4 bg-white border border-slate-300 rounded-2xl text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-xs"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center gap-2 disabled:opacity-50"
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
            <span className="text-xs text-slate-500 font-medium">Try asking:</span>
            {SAMPLE_SEARCH_PROMPTS.map((prompt, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setPrompt(prompt)}
                className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition shadow-2xs"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>

          {/* Location & Radius Slider */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="checkbox"
                id="useLoc"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 bg-white"
              />
              <label htmlFor="useLoc" className="text-xs text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Enable 2dsphere Proximity Radar (Center Manhattan)
              </label>
            </div>

            {useLocation && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs text-slate-600 whitespace-nowrap">
                  Radius: <strong className="text-slate-900">{radiusKm} km</strong>
                </span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-36 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Results Display */}
      {isLoading && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-4 shadow-xs">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Gemini 3.8 Flash Analyzing Matches</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Computing semantic vector intent, comparing colors, visual tags, spatial distance, and evaluating candidate probability...
          </p>
        </div>
      )}

      {!isLoading && searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-slate-900 px-1">
            <div>
              <h3 className="text-lg font-bold">
                {searchResults.matchesCount ?? searchResults.items.length} Matches Found
              </h3>
              <p className="text-xs text-slate-500">
                Sorted by AI Semantic Match Score for: &ldquo;{searchResults.query}&rdquo;
              </p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 font-medium">
              Gemini Vision &amp; Semantics
            </span>
          </div>

          {searchResults.items.length === 0 ? (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 shadow-xs">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching items found</p>
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
                    className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                      item.isTopMatch || isHigh
                        ? 'border-indigo-300 ring-2 ring-indigo-50 bg-gradient-to-r from-white via-indigo-50/20 to-white'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row gap-5 items-start">
                      {/* Image Thumbnail */}
                      <div className="relative w-full md:w-48 h-40 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-[11px] font-semibold text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                          {item.category}
                        </div>
                      </div>

                      {/* Content & Match Reasoning */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-lg font-bold text-slate-900 leading-tight">
                            {item.itemName}
                          </h4>

                          {/* Match Score Gauge */}
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${
                              isHigh
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isMedium
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{score}% Match</span>
                          </div>
                        </div>

                        {/* Gemini Reasoning Callout */}
                        {item.matchReason && (
                          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 space-y-1">
                            <span className="font-semibold text-indigo-700 block">
                              AI Match Assessment:
                            </span>
                            <p className="leading-relaxed text-indigo-950">{item.matchReason}</p>
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {item.locationName}
                          </span>
                          {item.distanceKm !== undefined && (
                            <span className="text-slate-700 font-medium">
                              ({item.distanceKm} km away)
                            </span>
                          )}
                          <span>&bull;</span>
                          <span>Color: {item.color}</span>
                        </div>

                        {/* Matching points badges */}
                        {item.matchingAttributes && item.matchingAttributes.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-500">Match factors:</span>
                            {item.matchingAttributes.map((attr: string, aIdx: number) => (
                              <span
                                key={aIdx}
                                className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md"
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
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition border border-slate-200"
                            >
                              View Details
                            </button>
                          )}
                          {item.status === 'found' ? (
                            onClaimClick && (
                              <button
                                onClick={() => onClaimClick(item)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                This is Mine (Claim)
                              </button>
                            )
                          ) : (
                            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
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
