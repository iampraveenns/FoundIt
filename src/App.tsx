import React, { useState, useEffect } from 'react';
import {
  Compass,
  Radio,
  Sparkles,
  CheckCircle2,
  Code2,
  Database,
  PlusCircle,
  Shield,
  ShieldCheck,
  MessageSquare,
  Map as MapIcon,
  Sliders,
  WifiOff,
  RefreshCw,
  FileText,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import LiveFeed from '../frontend/LiveFeed.jsx';
import SmartSearch from './components/SmartSearch.tsx';
import InteractiveMap from './components/InteractiveMap.tsx';
import ReportFoundWizard from './components/ReportFoundWizard.tsx';
import SecureChat from './components/SecureChat.tsx';
import SmartSearchSidebar, { SearchFilters } from './components/SmartSearchSidebar.tsx';
import AuditLogView from './components/AuditLogView.tsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.tsx';
import ClaimsHubManager from './components/ClaimsHubManager.tsx';
import AuthRoleModal from './components/AuthRoleModal.tsx';
import ItemDetailModal from './components/ItemDetailModal.tsx';
import ClaimModal from './components/ClaimModal.tsx';
import RadarView from './components/RadarView.tsx';
import { FoundItem, Stats, User } from './types.ts';
import { offlineDraftStore } from './utils/offlineQueue.ts';
import { io } from 'socket.io-client';

const DEFAULT_USER: User = {
  id: 'user_officer_01',
  name: 'Officer David Chen',
  email: 'officer.chen@transit.gov',
  role: 'TransitOfficer',
  badgeNumber: 'TR-8942',
  stationOrJurisdiction: 'Grand Central Lost & Found Hub',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'feed' | 'map' | 'search' | 'claims' | 'analytics' | 'audit' | 'specs'
  >('feed');
  const [items, setItems] = useState<FoundItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFound: 5, claimed: 1, active: 4, successRate: 20 });

  // Authentication & RBAC state
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Live Push Notification Toast State
  const [livePushAlert, setLivePushAlert] = useState<any | null>(null);

  // Modals & Drawers state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(null);
  const [itemToClaim, setItemToClaim] = useState<FoundItem | null>(null);
  const [chatItem, setChatItem] = useState<FoundItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Offline detection & queue
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingDraftsCount, setPendingDraftsCount] = useState(0);

  // Advanced search filters
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    dateRange: 'all',
    radiusKm: 25,
    status: 'All',
    color: '',
  });

  // Check online status and pending offline drafts
  const checkOfflineDrafts = async () => {
    try {
      const drafts = await offlineDraftStore.getAllDrafts();
      setPendingDraftsCount(drafts.filter((d) => d.syncStatus === 'pending').length);
    } catch (e) {
      // IndexedDB fallback
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      offlineDraftStore.syncAllPending((syncedItem) => {
        setItems((prev) => [syncedItem, ...prev]);
        checkOfflineDrafts();
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkOfflineDrafts();

    // Listen for real-time geospatial radius push alerts
    const socket = io({ transports: ['websocket', 'polling'] });
    socket.on('push:alert', (alertData: any) => {
      setLivePushAlert(alertData);
      setTimeout(() => setLivePushAlert(null), 7000);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.disconnect();
    };
  }, []);

  // Fetch initial data
  const refreshData = async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/items/stats'),
      ]);
      const itemsData = await itemsRes.json();
      const statsData = await statsRes.json();

      if (itemsData.success) setItems(itemsData.items);
      if (statsData.success) setStats(statsData.stats);
    } catch (err: unknown) {
      console.warn('Backend sync:', err);
    }
  };

  useEffect(() => {
    refreshData();
    // Pre-initialize session token for demo officer if not present
    if (!localStorage.getItem('foundit_token')) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEFAULT_USER.email, password: 'password123' }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.token) {
            localStorage.setItem('foundit_token', data.token);
            if (data.user) setCurrentUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleItemReported = (newItem: FoundItem) => {
    setItems((prev) => [newItem, ...prev]);
    refreshData();
    checkOfflineDrafts();
  };

  const handleClaimSuccess = (updatedItem: FoundItem) => {
    setItems((prev) =>
      prev.map((i) =>
        (i._id || i.id) === (updatedItem._id || updatedItem.id) ? updatedItem : i
      )
    );
    refreshData();
  };

  const handleHandshakeCompleted = (updatedItem: FoundItem) => {
    setItems((prev) =>
      prev.map((i) =>
        (i._id || i.id) === (updatedItem._id || updatedItem.id) ? updatedItem : i
      )
    );
    refreshData();
  };

  const handleManualSync = async () => {
    const res = await offlineDraftStore.syncAllPending((item) => {
      setItems((prev) => [item, ...prev]);
    });
    alert(`Sync Complete: ${res.syncedCount} offline drafts published.`);
    checkOfflineDrafts();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>Offline Mode Active &bull; Reports are safely queued locally in IndexedDB</span>
          </div>
          {pendingDraftsCount > 0 && (
            <span className="bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px]">
              {pendingDraftsCount} Draft(s) Queued
            </span>
          )}
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">FoundIt</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Enterprise MERN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI Lost &amp; Found &bull; Geospatial Clustering &bull; RBAC Custody Handshake
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Live Feed
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-teal-400" />
              Interactive Map
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'search'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AI Smart Search
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'claims'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Claims &amp; Hubs
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'specs'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Architecture
            </button>
          </nav>

          {/* User Persona & Role Widget */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left transition"
              title="Click to switch persona (Citizen, Transit Officer, Admin)"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-indigo-500/50"
              />
              <div className="hidden sm:block">
                <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                    currentUser.role === 'Admin'
                      ? 'bg-purple-500/20 text-purple-300'
                      : currentUser.role === 'TransitOfficer'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
            </button>

            {/* Multi-Step Wizard Trigger Button */}
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Item</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-2 bg-slate-950 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap ${
              activeTab === 'feed' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap ${
              activeTab === 'map' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap ${
              activeTab === 'search' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap ${
              activeTab === 'claims' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Claims
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Audit
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap ${
              activeTab === 'specs' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Docs
          </button>
        </div>
      </header>

      {/* Real-Time Push Notification Alert Banner */}
      {livePushAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-indigo-950/95 border-2 border-indigo-400 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white animate-bounce">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <strong className="text-xs font-bold text-indigo-300">📍 Native Geospatial Radius Alert</strong>
            </div>
            <button onClick={() => setLivePushAlert(null)} className="text-slate-400 hover:text-white text-xs">
              &times;
            </button>
          </div>
          <h4 className="text-xs font-bold mt-1 text-white">{livePushAlert.title}</h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{livePushAlert.body}</p>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'feed' && (
          <div className="space-y-6">
            <LiveFeed
              onSelectItem={(item: FoundItem) => setSelectedItem(item)}
              onClaimClick={(item: FoundItem) => setItemToClaim(item)}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <InteractiveMap
            items={items}
            onSelectItem={(item: FoundItem) => setSelectedItem(item)}
            onClaimClick={(item: FoundItem) => setItemToClaim(item)}
          />
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-2 shadow"
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Advanced Filter Drawer</span>
                {filters.categories.length > 0 && (
                  <span className="bg-indigo-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                    {filters.categories.length}
                  </span>
                )}
              </button>
            </div>
            <SmartSearch
              onSelectItem={(item: FoundItem) => setSelectedItem(item)}
              onClaimClick={(item: FoundItem) => setItemToClaim(item)}
            />
          </div>
        )}

        {activeTab === 'claims' && (
          <ClaimsHubManager
            currentUserRole={currentUser.role}
            currentUserName={currentUser.name}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}

        {activeTab === 'audit' && (
          <AuditLogView currentUserRole={currentUser.role} />
        )}

        {activeTab === 'specs' && (
          <div className="space-y-6 text-white">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <Code2 className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-bold">FoundIt Enterprise Architecture &amp; Modular Specifications</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Production-grade MERN platform augmented with enterprise RBAC, geospatial clustering, Gemini Vision multimodal pipelines, and offline-first PWA compliance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    1. Authentication &amp; RBAC
                  </span>
                  <p className="text-xs text-slate-300">
                    <code className="text-teal-300">models/User.js</code> &amp; <code className="text-teal-300">routes/auth.js</code> with JWT tokens, bcrypt encryption, and role gates: Standard, TransitOfficer, Admin.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-teal-400">
                    2. Geospatial Clustering
                  </span>
                  <p className="text-xs text-slate-300">
                    <code className="text-teal-300">InteractiveMap.tsx</code> dynamically clusters pins within radius circles, rendering GPS beacons and custom layer overlays.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    3. Multi-Step Wizard
                  </span>
                  <p className="text-xs text-slate-300">
                    <code className="text-teal-300">ReportFoundWizard.tsx</code> guides finders through 4 phases: Vision Analysis, AI Review, Map Pin Drop, and Challenge Creator.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-rose-400">
                    4. Secure In-App Chat
                  </span>
                  <p className="text-xs text-slate-300">
                    <code className="text-teal-300">SecureChat.tsx</code> facilitates anonymous coordination between owner and finder over Socket.io without leaking numbers.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    5. PWA &amp; Offline Queue
                  </span>
                  <p className="text-xs text-slate-300">
                    <code className="text-teal-300">public/service-worker.ts</code> &amp; IndexedDB queue allow users to draft items offline and auto-sync when back online.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-purple-400">
                    6. Audit Log Handshakes
                  </span>
                  <p className="text-xs text-slate-300">
                    <code className="text-teal-300">models/AuditLog.js</code> records official custody transfers, verified ownership proofs, and officer badge numbers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>FoundIt Enterprise &bull; Real-Time AI Lost &amp; Found Platform</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              WebSocket Feed Active
            </span>
            <span>&bull;</span>
            <span>Role: {currentUser.role} ({currentUser.name})</span>
          </div>
        </div>
      </footer>

      {/* 4-Step Found Item Wizard */}
      <ReportFoundWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onItemReported={handleItemReported}
      />

      {/* Secure In-App Handshake Chat */}
      <SecureChat
        item={chatItem}
        isOpen={Boolean(chatItem)}
        onClose={() => setChatItem(null)}
        currentUserRole={currentUser.role}
        currentUserName={currentUser.name}
        onHandshakeCompleted={handleHandshakeCompleted}
      />

      {/* Advanced Filter Drawer */}
      <SmartSearchSidebar
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChangeFilters={setFilters}
        onExecuteSearch={() => setActiveTab('search')}
      />

      {/* RBAC Persona & Auth Switcher Modal */}
      <AuthRoleModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(user, token) => {
          setCurrentUser(user);
          localStorage.setItem('foundit_token', token);
        }}
      />

      {/* Item Detail Inspector Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onClaimClick={(item: FoundItem) => {
          setSelectedItem(null);
          setItemToClaim(item);
        }}
      />

      {/* Ownership Verification Challenge Claim Modal */}
      <ClaimModal
        item={itemToClaim}
        isOpen={Boolean(itemToClaim)}
        onClose={() => setItemToClaim(null)}
        onClaimSuccess={(item) => {
          handleClaimSuccess(item);
          // Open secure chat to coordinate pickup
          setChatItem(item);
        }}
      />
    </div>
  );
}
