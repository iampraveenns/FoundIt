import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  MessageSquare,
  Send,
  X,
  ShieldCheck,
  Building,
  CheckCircle2,
  Lock,
  Sparkles,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { FoundItem } from '../types.ts';

interface ChatMessage {
  id: string;
  itemId: string;
  senderName: string;
  senderRole: string;
  senderId: string;
  text: string;
  isOfficerNote?: boolean;
  timestamp: string;
}

interface SecureChatProps {
  item: FoundItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string;
  currentUserName?: string;
  onHandshakeCompleted?: (item: FoundItem) => void;
}

export default function SecureChat({
  item,
  isOpen,
  onClose,
  currentUserRole = 'Standard',
  currentUserName = 'Citizen Claimant',
  onHandshakeCompleted,
}: SecureChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const itemId = item?._id || item?.id;

  // Load message history & connect to Socket.io room
  useEffect(() => {
    if (!isOpen || !itemId) return;

    // Fetch initial chat history
    fetch(`/api/items/${itemId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch((err) => console.warn('Chat history error:', err));

    // Connect socket
    const socket = io({
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('chat:join', itemId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Listen for live messages in this room
    const handleMessage = (msg: ChatMessage) => {
      if (msg.itemId === itemId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on('chat:message', handleMessage);
    socket.on(`chat:item:${itemId}`, handleMessage);

    return () => {
      socket.emit('chat:leave', itemId);
      socket.disconnect();
    };
  }, [isOpen, itemId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !itemId) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/items/${itemId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: currentUserName,
          senderRole: currentUserRole,
          text: textToSend.trim(),
          isOfficerNote: currentUserRole === 'TransitOfficer' || currentUserRole === 'Admin',
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        if (!customText) setInputText('');
      }
    } catch (err) {
      console.warn('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleOfficialHandshake = async () => {
    if (!itemId) return;
    try {
      const res = await fetch(`/api/items/${itemId}/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationLocation: 'Grand Central Hub Desk',
          handoverNotes: `Verified handover confirmed by ${currentUserName} (${currentUserRole})`,
          verifiedProofType: 'Government ID & Challenge Verification',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onHandshakeCompleted && item) {
          onHandshakeCompleted({ ...item, status: 'returned' });
        }
        handleSendMessage(undefined, '🔒 OFFICIAL HANDSHAKE COMPLETED: Item marked as returned and verified in municipal property records.');
      }
    } catch (err) {
      console.error('Handshake error:', err);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col h-[600px] overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold truncate">Secure Handshake Chat</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Coordination for: <strong className="text-slate-200">{item.itemName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Protection Notice Banner */}
        <div className="px-4 py-2 bg-indigo-950/60 border-b border-indigo-500/30 text-[11px] text-indigo-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Identity Masking: Phone numbers &amp; emails are never displayed.
          </span>
          <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">
            Role: {currentUserRole}
          </span>
        </div>

        {/* Quick Handshake Actions (Officer or User) */}
        <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => handleSendMessage(undefined, "Hello! I believe this is my item. I'm ready to answer the verification question.")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 rounded-lg whitespace-nowrap transition"
          >
            👋 Send Ownership Claim
          </button>
          <button
            onClick={() => handleSendMessage(undefined, `Can you meet at ${item.locationName} or the nearest transit security desk?`)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 rounded-lg whitespace-nowrap transition"
          >
            📍 Propose Safe Meetup
          </button>

          {(currentUserRole === 'TransitOfficer' || currentUserRole === 'Admin') && item.status !== 'returned' && (
            <button
              onClick={handleOfficialHandshake}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white rounded-lg whitespace-nowrap transition flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Seal Official Handshake
            </button>
          )}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/20">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-1">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">No messages yet</p>
              <p className="text-[11px]">Start the conversation to coordinate a safe custody return.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isOfficer = m.senderRole === 'TransitOfficer' || m.senderRole === 'Admin';
              const isCurrentUser = m.senderName === currentUserName;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                    <span className="font-semibold text-slate-300">{m.senderName}</span>
                    {isOfficer && (
                      <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        {m.senderRole}
                      </span>
                    )}
                    <span>&bull;</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.text.includes('OFFICIAL HANDSHAKE')
                        ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-100 font-semibold'
                        : isCurrentUser
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => handleSendMessage(e)} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type message to coordinate safe pickup..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
