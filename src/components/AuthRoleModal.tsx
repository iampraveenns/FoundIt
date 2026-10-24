import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  ShieldCheck,
  Building,
  KeyRound,
  CheckCircle2,
  LogIn,
  UserPlus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { User as UserType } from '../types.ts';

interface AuthRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onUserChanged: (user: UserType, token: string) => void;
}

const PRESET_ACCOUNTS = [
  {
    role: 'Standard' as const,
    name: 'Sarah Connor (Citizen)',
    email: 'sarah@citizen.org',
    password: 'password123',
    badge: 'Citizen User',
    desc: 'Report found items, execute semantic searches, and submit ownership challenge claims.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  },
  {
    role: 'TransitOfficer' as const,
    name: 'Officer David Chen',
    email: 'officer.chen@transit.gov',
    password: 'password123',
    badge: 'Badge #TR-8942',
    desc: 'Verify proof of ownership, seal physical handshakes, and access station audit records.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  },
  {
    role: 'Admin' as const,
    name: 'Chief Elena Rostova',
    email: 'admin@foundit.org',
    password: 'admin123',
    badge: 'Chief Commander #ADM-001',
    desc: 'Full municipal oversight, custody transfer overrides, and immutable log administration.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
  },
];

export default function AuthRoleModal({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}: AuthRoleModalProps) {
  const [activeMode, setActiveMode] = useState<'presets' | 'custom'>('presets');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Standard' | 'TransitOfficer' | 'Admin'>('Standard');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = async (preset: (typeof PRESET_ACCOUNTS)[0]) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preset.email, password: preset.password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      onUserChanged(data.user, data.token);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to authenticate preset persona.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { name, email, password, role: selectedRole, badgeNumber }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      onUserChanged(data.user, data.token);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6 text-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">RBAC Identity &amp; Role Simulator</h3>
              <p className="text-xs text-slate-400">Switch persona or sign in to verify permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="p-4 px-6 bg-slate-950/30 border-b border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => setActiveMode('presets')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
              activeMode === 'presets' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Enterprise Demo Personas
          </button>
          <button
            onClick={() => setActiveMode('custom')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
              activeMode === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom Sign In / Register
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeMode === 'presets' ? (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-medium block">
                Select an enterprise role to test permissions and handshakes:
              </span>
              {PRESET_ACCOUNTS.map((p) => {
                const isCurrent = currentUser?.email === p.email;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    disabled={isLoading}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition group ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-500/15'
                        : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/70'
                    }`}
                  >
                    <img src={p.avatarUrl} alt={p.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-slate-700" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs font-bold text-white truncate">{p.name}</strong>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          p.role === 'Admin'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : p.role === 'TransitOfficer'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {p.role}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-300 block">{p.badge}</span>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCustomAuth} className="space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-slate-300">
                  {isRegister ? 'Create New Account' : 'Sign In With Credentials'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {isRegister ? 'Have an account? Sign In' : 'New user? Register'}
                </button>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Inspector Jean Valjean"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@transit.gov"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              {isRegister && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      <option value="Standard">Standard Citizen</option>
                      <option value="TransitOfficer">Transit Officer</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Badge ID (optional)</label>
                    <input
                      type="text"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      placeholder="e.g. TR-204"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isRegister ? 'Create Account' : 'Authenticate Session'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
