import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  MapPin,
  Tag,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface ReportLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated?: (report: any) => void;
}

const CATEGORIES = [
  'Electronics',
  'Bags & Wallets',
  'Keys & Badges',
  'Eyewear',
  'Clothing & Accessories',
  'Documents & Cards',
  'Other',
];

export default function ReportLostModal({ isOpen, onClose, onReportCreated }: ReportLostModalProps) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [primaryColor, setPrimaryColor] = useState('');
  const [brandOrManufacturer, setBrandOrManufacturer] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [identifyingMarks, setIdentifyingMarks] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [lastSeenLocationName, setLastSeenLocationName] = useState('Grand Central Concourse');
  const [searchRadiusKm, setSearchRadiusKm] = useState(15);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [tagsInput, setTagsInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !detailedDescription) {
      setError('Please provide an item name and description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch('/api/lost-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          category,
          primaryColor: primaryColor || 'Unspecified',
          brandOrManufacturer,
          serialNumberOrIMEI: serialNumber,
          identifyingMarks,
          detailedDescription,
          searchTags: tags,
          lastSeenLocationName,
          searchRadiusKm,
          rewardAmount: Number(rewardAmount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit lost report');
      }

      setMatchResult(data);
      if (onReportCreated) onReportCreated(data.report);
    } catch (err: any) {
      setError(err.message || 'Error creating report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-900 my-6">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <HelpCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Report a Lost Item</h3>
              <p className="text-xs text-slate-500">
                Automated dual-direction AI vector matching against municipal intake catalogs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {matchResult ? (
          /* Match Confirmation Screen */
          <div className="p-6 space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Notice #{matchResult.report.reportNumber} Registered Successfully!</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our vector matching engine immediately scanned the municipal database. Found{' '}
                <strong className="text-emerald-700">{matchResult.topMatches?.length || 0} candidate matches</strong>.
              </p>
            </div>

            {matchResult.topMatches?.length > 0 ? (
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">Top Scored Potential Matches:</span>
                {matchResult.topMatches.map((m: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-slate-900">{m.itemName}</strong>
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        {Math.round(m.score * 100)}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{m.matchRationale}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No immediate matches found yet. We will notify you via push and email the moment a matching item is turned in.
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              Done &bull; Return to Feed
            </button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">What did you lose? *</label>
              <input
                type="text"
                placeholder="e.g. Sony WH-1000XM5 Wireless Headphones in Gray Case"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Primary Color</label>
                <input
                  type="text"
                  placeholder="e.g. Matte Black / Silver"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Brand / Make</label>
                <input
                  type="text"
                  placeholder="e.g. Sony, Apple, Fossil"
                  value={brandOrManufacturer}
                  onChange={(e) => setBrandOrManufacturer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Serial / IMEI / Engraving</label>
                <input
                  type="text"
                  placeholder="e.g. Serial ending in 9481"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Detailed Description &bull; Unique Marks *</label>
              <textarea
                rows={3}
                placeholder="Describe stickers, scratches, contents, or where you remember having it last..."
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Last Seen Station / Area</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Central Subway or Bryant Park"
                  value={lastSeenLocationName}
                  onChange={(e) => setLastSeenLocationName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Search Proximity Radius: <strong className="text-amber-700">{searchRadiusKm} km</strong>
                </label>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={searchRadiusKm}
                  onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                  className="w-full accent-amber-500 mt-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Search Keywords (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. headphones, sony, wireless, gray, case"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Running Vector Matcher...' : 'Submit & Find Matches'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
