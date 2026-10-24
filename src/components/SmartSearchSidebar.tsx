import React, { useState } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  RotateCcw,
  Sliders,
  Check,
  X,
} from 'lucide-react';

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

const DATE_RANGES = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Last 24 Hours' },
  { id: '3days', label: 'Last 3 Days' },
  { id: 'week', label: 'Last 7 Days' },
];

export interface SearchFilters {
  query: string;
  categories: string[];
  dateRange: string;
  radiusKm: number;
  status: 'All' | 'found' | 'claimed';
  color: string;
}

interface SmartSearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onChangeFilters: (filters: SearchFilters) => void;
  onExecuteSearch: () => void;
}

export default function SmartSearchSidebar({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  onExecuteSearch,
}: SmartSearchSidebarProps) {
  const toggleCategory = (cat: string) => {
    const exists = filters.categories.includes(cat);
    const updated = exists
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChangeFilters({ ...filters, categories: updated });
  };

  const handleReset = () => {
    onChangeFilters({
      query: '',
      categories: [],
      dateRange: 'all',
      radiusKm: 25,
      status: 'All',
      color: '',
    });
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl p-6 flex flex-col justify-between text-white overflow-y-auto animate-slide-left">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Advanced AI Filter Drawer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Natural Language Search Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Natural Query
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Lost navy backpack with blue bottle"
              value={filters.query}
              onChange={(e) => onChangeFilters({ ...filters, query: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category Multi-Select */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Categories ({filters.categories.length ? filters.categories.length : 'Any'})
            </label>
            {filters.categories.length > 0 && (
              <button
                onClick={() => onChangeFilters({ ...filters, categories: [] })}
                className="text-[10px] text-indigo-400 hover:text-indigo-300"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map((cat) => {
              const selected = filters.categories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs text-left truncate transition flex items-center justify-between ${
                    selected
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {selected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Proximity Distance Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Proximity Radius
            </span>
            <strong className="text-indigo-400 font-bold">{filters.radiusKm} km</strong>
          </div>
          <input
            type="range"
            min="2"
            max="60"
            step="2"
            value={filters.radiusKm}
            onChange={(e) => onChangeFilters({ ...filters, radiusKm: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Date Range Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            Date Found Window
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {DATE_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => onChangeFilters({ ...filters, dateRange: r.id })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filters.dateRange === r.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Pill Switcher */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Item Status</label>
          <div className="flex items-center gap-2">
            {(['All', 'found', 'claimed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => onChangeFilters({ ...filters, status: st })}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  filters.status === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-6 border-t border-slate-800 flex items-center gap-3">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        <button
          onClick={() => {
            onExecuteSearch();
            onClose();
          }}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition text-center"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
