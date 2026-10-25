import React, { useState } from 'react';
import {
  Terminal,
  Send,
  Code2,
  CheckCircle2,
  Copy,
  Layers,
  Globe,
  Database,
  Shield,
  Sparkles,
} from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  category: string;
  description: string;
  sampleBody?: string;
  authRequired: boolean;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/items',
    category: 'Catalog & Intake',
    description: 'Retrieve real-time found item records with geospatial coordinates and tags',
    authRequired: false,
  },
  {
    method: 'POST',
    path: '/api/items/search',
    category: 'Catalog & Intake',
    description: 'Natural language semantic search with proximity radius filtering',
    sampleBody: JSON.stringify({ query: 'Lost black headphones near Central Park', radiusKm: 15 }, null, 2),
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/claims',
    category: 'Claim State Machine',
    description: 'List all multi-stage claims and secondary Gemini AI forensic assessments',
    authRequired: false,
  },
  {
    method: 'POST',
    path: '/api/claims',
    category: 'Claim State Machine',
    description: 'Submit an ownership claim with challenge response and proof',
    sampleBody: JSON.stringify({
      itemId: 'seed-item-1',
      claimantName: 'Jane Doe',
      claimantEmail: 'jane@example.com',
      ownershipProof: { challengeAnswer: 'Sky blue silicone carabiner strap' },
    }, null, 2),
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/hubs',
    category: 'Multi-Agency Stations',
    description: 'List all metropolitan transit hubs, active locker banks, and zones',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/hubs/transfers/all',
    category: 'Multi-Agency Stations',
    description: 'Retrieve inter-terminal custody transfer manifests with tamper seal numbers',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/ledger/chain',
    category: 'Blockchain Ledger',
    description: 'Get all cryptographically sealed SHA-256 custody blocks on chain',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/ledger/verify',
    category: 'Blockchain Ledger',
    description: 'Execute mathematical proof-of-integrity check across entire blockchain',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/lost-reports',
    category: 'Lost Registry & Matcher',
    description: 'List citizen missing property notices and auto-matched candidates',
    authRequired: false,
  },
  {
    method: 'POST',
    path: '/api/privacy/scan',
    category: 'Privacy Pipeline',
    description: 'Scan and redact credit cards (Luhn check), SSNs, phones, and addresses',
    sampleBody: JSON.stringify({ text: 'Call me at 555-891-2341 or card 4532-1234-5678-9010' }, null, 2),
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/analytics/forecast',
    category: 'ML Forecast & BI',
    description: '14-day rolling recovery volume predictions using exponential smoothing',
    authRequired: false,
  },
];

export default function ApiDocsView() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState<string>(selectedEndpoint.sampleBody || '');
  const [responseOutput, setResponseOutput] = useState<string>('Click "Execute Endpoint" to test live.');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelect = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setRequestBody(endpoint.sampleBody || '');
    setResponseOutput('Click "Execute Endpoint" to test live.');
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const data = await res.json();
      setResponseOutput(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResponseOutput(JSON.stringify({ error: e.message || 'Execution failed' }, null, 2));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyCurl = () => {
    let curlCmd = `curl -X ${selectedEndpoint.method} http://localhost:3000${selectedEndpoint.path}`;
    if (selectedEndpoint.method !== 'GET' && requestBody) {
      curlCmd += ` -H "Content-Type: application/json" -d '${requestBody.replace(/\n/g, '')}'`;
    }
    navigator.clipboard.writeText(curlCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Terminal className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Interactive OpenAPI / REST Integration Console</h2>
              <p className="text-xs text-slate-500">
                Live interactive console for testing municipal microservices, vector matching, ledger blocks, and privacy filters.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleCopyCurl}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center gap-2 shadow-2xs"
        >
          <Copy className="w-4 h-4" />
          <span>{copied ? 'Copied cURL!' : 'Copy cURL Command'}</span>
        </button>
      </div>

      {/* Main Grid: Endpoint List + Test Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoint Catalog */}
        <div className="lg:col-span-5 space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {ENDPOINTS.map((ep, i) => {
            const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;

            return (
              <div
                key={i}
                onClick={() => handleSelect(ep)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-100 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      ep.method === 'GET'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : ep.method === 'POST'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 truncate">{ep.path}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{ep.description}</p>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">&bull; {ep.category}</span>
              </div>
            );
          })}
        </div>

        {/* Right: Live Request / Response Console */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                  selectedEndpoint.method === 'GET'
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : selectedEndpoint.method === 'POST'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <strong className="text-sm font-mono text-slate-900">{selectedEndpoint.path}</strong>
            </div>

            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isExecuting ? 'Sending...' : 'Execute Endpoint'}</span>
            </button>
          </div>

          {/* Request Payload Editor (if POST/PATCH) */}
          {selectedEndpoint.method !== 'GET' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">Request JSON Body</label>
              <textarea
                rows={5}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full p-3 bg-slate-50 font-mono text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          )}

          {/* Response Viewer */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">Live HTTP Response Payload</label>
            <pre className="p-4 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[320px] leading-relaxed shadow-inner">
              {responseOutput}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
