import React, { useState } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  MapPin,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { FoundItem } from '../types.ts';

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
    note: 'Left at table after coffee rush. Has a gym badge and cards inside.',
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
    name: 'Teal Hydro Flask Bottle',
    category: 'Sports & Outdoor',
    note: 'Left on the yoga studio counter',
    locationName: 'Chelsea Athletic Club',
    lat: 40.745,
    lng: -74.001,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  },
];

interface ReportFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemReported?: (item: FoundItem) => void;
}

export default function ReportFoundModal({
  isOpen,
  onClose,
  onItemReported,
}: ReportFoundModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [note, setNote] = useState('');
  const [locationName, setLocationName] = useState('Central Park Conservatory, NYC');
  const [lat, setLat] = useState('40.7829');
  const [lng, setLng] = useState('-73.9654');
  const [reportedBy, setReportedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiStage, setAiStage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSelectPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setSelectedFile(null);
    setPreviewUrl(preset.imageUrl);
    setNote(preset.note);
    setLocationName(preset.locationName);
    setLat(String(preset.lat));
    setLng(String(preset.lng));
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(4));
          setLng(pos.coords.longitude.toFixed(4));
          setLocationName('Current Geolocation Landmark');
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err.message);
          setError('Location access was denied; using custom coordinates.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl && !selectedFile) {
      setError('Please provide or select a photo of the found item.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setAiStage('Uploading photo and initializing Gemini multimodal vision analysis...');

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (previewUrl) {
        formData.append('imageUrlInput', previewUrl);
      }

      formData.append('textNote', note || 'Found item in public space');
      formData.append('locationName', locationName);
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('reportedBy', reportedBy || 'Good Samaritan');

      setAiStage('Gemini 3.8 Flash analyzing visual features, color, category, tags & security question...');

      const response = await fetch('/api/items/found', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit found item');
      }

      setAiStage('Gemini extraction complete! Broadcasting real-time event via Socket.io...');

      if (onItemReported) {
        onItemReported(data.item);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setAiStage('');
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error reporting item:', msg);
      setError(msg || 'Something went wrong while reporting item.');
      setIsSubmitting(false);
      setAiStage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Report a Found Item</h3>
              <p className="text-xs text-slate-400">
                Gemini Vision AI automatically detects category, brand, color, tags &amp; challenge question
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preset quick test selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Quick Test: Select a Sample Item or Upload Your Own
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2 rounded-xl text-left border transition text-xs flex flex-col items-center text-center gap-1.5 ${
                    previewUrl === p.imageUrl
                      ? 'border-indigo-500 bg-indigo-500/10 text-white font-semibold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <span className="line-clamp-1">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Item Photograph
            </label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-4 text-center bg-slate-950/40 transition">
              {previewUrl ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden group">
                  <img
                    src={previewUrl}
                    alt="Found item preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-500">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center py-6">
                  <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                  <span className="text-sm font-semibold text-white">Click or Drag &amp; Drop to upload photo</span>
                  <span className="text-xs text-slate-400 mt-1">
                    Supports JPG, PNG, WEBP up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Finder Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Finder's Note or Observation
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <textarea
                rows={2}
                placeholder="Where exactly was it found? (e.g. Under bench at gate 4, has a blue carabiner attached, left on counter around 3pm)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Location and Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Location Name / Landmark
                </label>
                <button
                  type="button"
                  onClick={detectLocation}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Auto-detect GPS
                </button>
              </div>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Bryant Park Reading Room, NYC"
                className="w-full px-3.5 py-2 bg-slate-950/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950/50 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950/50 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Finder Name / Tag
              </label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="Citizen Sam"
                className="w-full px-3 py-1.5 bg-slate-950/50 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* AI Progress status banner */}
          {isSubmitting && (
            <div className="p-4 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Gemini Multimodal Vision Pipeline
                </p>
                <p className="text-xs text-indigo-300/80">{aiStage}</p>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Extract with Gemini &amp; Broadcast Live</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
