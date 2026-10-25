import React, { useState } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft,
  Tag,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  Building,
  UserCheck,
  WifiOff,
} from 'lucide-react';
import { FoundItem } from '../types.ts';
import { offlineDraftStore } from '../utils/offlineQueue.ts';

const SAMPLE_PRESETS = [
  {
    name: 'AirPods Pro Case',
    category: 'Electronics',
    note: 'Found on a park bench near the jogging path',
    locationName: 'Central Park North, near reservoir',
    lat: 40.785,
    lng: -73.965,
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Black Leather Fossil Wallet',
    category: 'Bags & Wallets',
    note: 'Left at table after coffee rush. Has gym badge and cards inside.',
    locationName: 'SoHo Blue Bottle Coffee',
    lat: 40.723,
    lng: -73.999,
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Key Fob with Titanium Ring',
    category: 'Keys & Badges',
    note: 'Found in the subway exit stairwell',
    locationName: '14th St Union Square Subway Exit',
    lat: 40.735,
    lng: -73.991,
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ray-Ban Sunglasses in Case',
    category: 'Eyewear',
    note: 'Left on the wooden bench at 23rd St overlook',
    locationName: 'High Line at 23rd Street',
    lat: 40.748,
    lng: -74.004,
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
  },
];

const CATEGORIES = [
  'Electronics',
  'Bags & Wallets',
  'Keys & Badges',
  'Eyewear',
  'Clothing & Accessories',
  'Documents & Cards',
  'Jewelry & Watches',
  'Sports & Outdoor',
  'Other',
];

interface ReportFoundWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onItemReported?: (item: FoundItem) => void;
}

export default function ReportFoundWizard({
  isOpen,
  onClose,
  onItemReported,
}: ReportFoundWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Photo & Finder note
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [finderNote, setFinderNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(0.95);

  // Step 2: Extracted metadata
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Other');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Step 3: Map Pin & Landmark
  const [locationName, setLocationName] = useState('Midtown Manhattan, NYC');
  const [lat, setLat] = useState('40.7580');
  const [lng, setLng] = useState('-73.9855');

  // Step 4: Verification Challenge & Handover
  const [claimQuestion, setClaimQuestion] = useState('');
  const [handoverPreference, setHandoverPreference] = useState<'transit_desk' | 'direct_meetup' | 'safe_locker'>('transit_desk');
  const [contactHint, setContactHint] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [offlineSaved, setOfflineSaved] = useState(false);

  if (!isOpen) return null;

  // Step 1: Upload and auto-analyze with Gemini
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      triggerGeminiAnalysis(file, finderNote);
    }
  };

  const handleSelectPreset = (p: (typeof SAMPLE_PRESETS)[0]) => {
    setSelectedFile(null);
    setPreviewUrl(p.imageUrl);
    setFinderNote(p.note);
    setItemName(p.name);
    setCategory(p.category);
    setLocationName(p.locationName);
    setLat(String(p.lat));
    setLng(String(p.lng));
    setDescription(p.note);
    setTags(['found', p.category.toLowerCase()]);
    setClaimQuestion('What brand or unique marking is identifiable on this item?');
  };

  const triggerGeminiAnalysis = async (file?: File, note?: string) => {
    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('image', file);
      } else if (previewUrl) {
        formData.append('imageUrlInput', previewUrl);
      }
      formData.append('textNote', note || finderNote || 'Found in public transit');
      formData.append('locationName', locationName);
      formData.append('lat', lat);
      formData.append('lng', lng);

      // Call extraction endpoint
      const res = await fetch('/api/items/found', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.item) {
        setItemName(data.item.itemName);
        setCategory(data.item.category);
        setColor(data.item.color);
        setDescription(data.item.description);
        setTags(data.item.searchTags || ['found']);
        setAiConfidence(data.item.aiConfidence || 0.95);
        if (data.item.claimQuestion) {
          setClaimQuestion(data.item.claimQuestion);
        }
      }
    } catch (err) {
      console.warn('Gemini vision extraction fallback applied:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTag = () => {
    const clean = newTagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Step 3 Pin Drop Simulator: Click on mini map to adjust coordinates
  const handleMapPinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newLng = -74.02 + (x / rect.width) * 0.08;
    const newLat = 40.79 - (y / rect.height) * 0.08;
    setLat(newLat.toFixed(4));
    setLng(newLng.toFixed(4));
  };

  // Step 4: Final Submission
  const handleFinalSubmit = async () => {
    if (!itemName.trim()) {
      setError('Item title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Check if offline: if offline, queue draft locally into IndexedDB
    if (!navigator.onLine) {
      try {
        const offlineItem = await offlineDraftStore.saveDraft({
          itemName,
          category,
          color,
          description,
          locationName,
          lat: Number(lat),
          lng: Number(lng),
          claimQuestion: claimQuestion || 'Can you identify a specific scratch or engraving?',
          finderNote,
          handoverPreference,
          imageUrl: previewUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
          searchTags: tags,
        });

        setOfflineSaved(true);
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
        }, 1800);
        return;
      } catch (e) {
        console.warn('Offline storage write:', e);
      }
    }

    try {
      const payload = {
        itemName,
        category,
        color: color || 'Neutral',
        description: description || finderNote || 'Found in transit',
        locationName,
        lat: Number(lat) || 40.758,
        lng: Number(lng) || -73.9855,
        claimQuestion: claimQuestion || 'What unique identifying mark or detail exists on this item?',
        imageUrlInput: previewUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        searchTags: tags.join(','),
        handoverPreference,
      };

      const res = await fetch('/api/items/found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit found item');
      }

      if (onItemReported) {
        onItemReported(data.item);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Wizard submit error:', msg);
      setError(msg || 'Failed to submit found item');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 text-slate-900 flex flex-col max-h-[92vh]">
        {/* Wizard Header & Progress Bar */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Report Found Item Wizard</h3>
                <p className="text-xs text-slate-500">Step {currentStep} of 4: Enterprise Multimodal Workflow</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Steps Bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'Vision Upload' },
              { num: 2, label: 'AI Review' },
              { num: 3, label: 'Pin Drop' },
              { num: 4, label: 'Security & Custody' },
            ].map((step) => {
              const isPast = currentStep > step.num;
              const isCurr = currentStep === step.num;
              return (
                <div key={step.num} className="space-y-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isPast || isCurr ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-semibold block truncate ${
                      isCurr ? 'text-indigo-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {step.num}. {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {offlineSaved && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong className="block font-bold">Saved to Offline Draft Queue!</strong>
                <span>Your report is safely cached in IndexedDB. It will automatically broadcast to FoundIt when connectivity returns.</span>
              </div>
            </div>
          )}

          {/* STEP 1: Vision Photo Upload & Presets */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select a Sample Item or Upload Live Photo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_PRESETS.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-2 rounded-xl text-left border transition text-xs flex flex-col items-center text-center gap-1.5 ${
                        previewUrl === p.imageUrl
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-100'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                      <span className="line-clamp-1">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Zone */}
              <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-4 text-center bg-slate-50 transition">
                {previewUrl ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden group border border-slate-200">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                        <span className="text-xs font-bold text-slate-900">Gemini 3.8 Flash Analyzing Photo...</span>
                        <span className="text-[10px] text-slate-500">Detecting category, color, marks &amp; security question</span>
                      </div>
                    )}
                    <label className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 hover:bg-white shadow-xs">
                      Change Photo
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center py-8">
                    <Upload className="w-8 h-8 text-indigo-600 mb-2" />
                    <span className="text-sm font-semibold text-slate-800">Upload Photograph of Item</span>
                    <span className="text-xs text-slate-500 mt-1">Instant multimodal OCR and brand recognition</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Quick Finder Observation Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Finder Note / Context Clue
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Found on subway car 4, seat 12B near Grand Central station around 1:30 PM"
                  value={finderNote}
                  onChange={(e) => setFinderNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: AI Review & Metadata Editing */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  AI Vision Confident ({Math.round(aiConfidence * 100)}%)
                </span>
                <span className="text-[11px] text-indigo-700 font-semibold">You can edit any extracted attributes below</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item Title</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Apple AirPods Pro 2 in MagSafe Case"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Color(s)</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. White case with blue strap"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Visual Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Tag Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Search Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg border border-slate-200 flex items-center gap-1.5"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add search tag (e.g. bluetooth, leather)..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Interactive Map Pin Drop */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location Landmark &amp; Address
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Grand Central Concourse, NYC"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Interactive Mini Map Pin Drop Surface */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Click anywhere on the map to drop precise pin:</span>
                  <span className="font-mono text-indigo-700 font-bold">[{lng}, {lat}]</span>
                </div>
                <div
                  onClick={handleMapPinClick}
                  className="relative w-full h-56 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden cursor-crosshair shadow-inner group"
                >
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                  {/* Crosshair Lines */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-200" />

                  {/* Dropped Pin */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                    <MapPin className="w-7 h-7 text-rose-500 fill-rose-500 animate-bounce" />
                    <span className="px-2 py-0.5 bg-white text-[10px] font-bold text-slate-800 rounded shadow-xs border border-slate-200 whitespace-nowrap">
                      Exact Found Coordinate
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Security Verification & Handover Preferences */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Challenge question */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Ownership Challenge Question (Confidential Verification)
                </label>
                <input
                  type="text"
                  value={claimQuestion}
                  onChange={(e) => setClaimQuestion(e.target.value)}
                  placeholder="e.g. What color sticker was on the back or what initials are engraved inside?"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  Only the genuine owner will be asked to answer this before custody is approved.
                </p>
              </div>

              {/* Handover Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Preferred Handover Custody Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setHandoverPreference('transit_desk')}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                      handoverPreference === 'transit_desk'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-semibold ring-2 ring-indigo-100'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-4 h-4 text-indigo-600" />
                    <strong className="text-xs text-slate-900">Transit Desk</strong>
                    <span className="text-[10px] text-slate-500">Handed over to station staff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHandoverPreference('direct_meetup')}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                      handoverPreference === 'direct_meetup'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-semibold ring-2 ring-indigo-100'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <strong className="text-xs text-slate-900">Direct Meetup</strong>
                    <span className="text-[10px] text-slate-500">Safe in-app anonymous chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHandoverPreference('safe_locker')}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                      handoverPreference === 'safe_locker'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-semibold ring-2 ring-indigo-100'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-amber-600" />
                    <strong className="text-xs text-slate-900">Secure Locker</strong>
                    <span className="text-[10px] text-slate-500">Deposit box with access code</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => (s - 1) as any)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <span />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && !previewUrl) {
                  setError('Please select or upload a photo of the item.');
                  return;
                }
                setError('');
                setCurrentStep((s) => (s + 1) as any);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Broadcasting Item...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish to Real-Time Feed</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
