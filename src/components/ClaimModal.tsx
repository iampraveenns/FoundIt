import React, { useState } from 'react';
import { X, ShieldCheck, HelpCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { FoundItem } from '../types.ts';

interface ClaimModalProps {
  item: FoundItem | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess?: (updatedItem: FoundItem) => void;
}

export default function ClaimModal({ item, isOpen, onClose, onClaimSuccess }: ClaimModalProps) {
  const [answer, setAnswer] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Please provide an answer to verify ownership.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/items/${item._id || item.id}/claim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'claimed',
          claimantAnswer: answer.trim(),
          claimantContact: contact.trim() || 'Confidential Claimant',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit claim');
      }

      setIsSuccess(true);
      if (onClaimSuccess) onClaimSuccess(data.item);

      setTimeout(() => {
        setIsSuccess(false);
        setAnswer('');
        setContact('');
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Claim error:', msg);
      setError(msg || 'Failed to claim item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ownership Verification Claim</h3>
              <p className="text-xs text-slate-500">Protecting lost items from false claims</p>
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

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-900">Claim Verification Submitted!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your answer has been registered and the item status marked as claimed. The finder will be notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Item Summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <img
                src={item.imageUrl}
                alt={item.itemName}
                className="w-14 h-14 object-cover rounded-xl flex-shrink-0 border border-slate-200"
              />
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-slate-900 truncate">{item.itemName}</h4>
                <p className="text-xs text-slate-500 truncate">{item.locationName}</p>
                <span className="text-[10px] text-indigo-700 font-semibold">Found: {item.color}</span>
              </div>
            </div>

            {/* AI Security Question */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-semibold">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                AI Security Challenge:
              </div>
              <p className="text-sm font-medium text-indigo-950">
                {item.claimQuestion || 'Can you describe a distinctive marking or hidden feature of this item?'}
              </p>
            </div>

            {/* Answer Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Answer / Proof of Ownership
              </label>
              <textarea
                rows={3}
                placeholder="Provide accurate details only the real owner would know (e.g. engraving, sticker, contents, serial digits)..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Contact details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact Email or Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. owner@example.com or (555) 234-5678"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Claim</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
