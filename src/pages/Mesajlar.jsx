import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  RefreshCw,
  Search,
  MoreVertical,
  Check,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso.replace(' ', 'T') + 'Z');
    return d.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function Mesajlar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(searchParams.get('to') ? Number(searchParams.get('to')) : null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) navigate('/giris');
  }, [user, loading, navigate]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvos(true);
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConvos(false);
    }
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadThread = useCallback(async (otherId) => {
    if (!otherId) return;
    try {
      const data = await api.getThread(otherId);
      setActiveUser(data.user);
      setMessages(data.messages);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (activeUserId) loadThread(activeUserId);
  }, [activeUserId, loadThread]);

  useEffect(() => {
    if (!activeUserId) return undefined;
    const interval = window.setInterval(() => {
      loadThread(activeUserId);
      loadConversations();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [activeUserId, loadThread, loadConversations]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleChatSelect = (id) => setActiveUserId(id);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeUserId) return;
    const text = messageText;
    setMessageText('');
    try {
      const sent = await api.sendMessage(activeUserId, text);
      setMessages((prev) => [...prev, sent]);
      loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-200 selection:text-blue-900 flex flex-col relative overflow-hidden pt-24">

      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-[150px] pointer-events-none z-0"></div>

      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.9);
        }
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 20px; }
      `}</style>

      <main className="flex-grow max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10 h-screen flex flex-col">

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">

          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-4 h-full flex flex-col glass-panel rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden border border-slate-200/60">

            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200/80 bg-white/50 backdrop-blur-md">
              <h2 className="text-xl font-bold text-slate-900">Mesajlar</h2>
              <button onClick={loadConversations} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shadow-sm">
                <RefreshCw className={`w-5 h-5 ${loadingConvos ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto chat-scroll divide-y divide-slate-100">
              {conversations.length === 0 && !loadingConvos && (
                <div className="p-10 text-center text-slate-400">
                  <User className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  Hələ heç bir mesajınız yoxdur.
                </div>
              )}
              {conversations.map((chat) => {
                const isActive = activeUserId === chat.userId;
                const initials = (chat.user?.fullName || '?').slice(0, 2).toUpperCase();
                return (
                  <div
                    key={chat.userId}
                    onClick={() => handleChatSelect(chat.userId)}
                    className={`px-6 py-5 cursor-pointer transition-all duration-200 group relative ${
                      isActive ? 'bg-blue-100/60 border-l-4 border-l-blue-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${isActive ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className={`font-bold truncate pr-2 ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                            {chat.user?.fullName || 'İstifadəçi'}
                          </h3>
                          <span className={`text-[11px] whitespace-nowrap font-medium ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                            {formatTime(chat.time)}
                          </span>
                        </div>
                        <div className="flex justify-between items-end gap-2">
                          <p className={`text-sm truncate flex-1 ${isActive ? 'text-blue-800/80 font-medium' : 'text-slate-500'}`}>
                            {chat.isSentByMe ? 'Siz: ' : ''}{chat.lastMessage}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT MAIN AREA */}
          <div className="lg:col-span-8 h-[calc(100vh-4rem)] lg:h-full flex flex-col glass-panel rounded-3xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-200/60 relative">

            {!activeUserId || !activeUser ? (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400 bg-white/40">
                <div className="w-32 h-32 mb-6 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm opacity-60">
                  <Search className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-medium text-slate-500">Dialoq seçin</h3>
                <p className="text-slate-400 mt-2 text-sm">Mesajlaşmağa başlamaq üçün sol tərəfdən bir istifadəçi seçin</p>
              </div>
            ) : (
              <>
                <div className="px-8 py-5 flex items-center justify-between border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-500 shadow-sm">
                      {(activeUser.fullName || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{activeUser.fullName}</h2>
                      <span className="text-sm text-slate-500 font-medium">
                        {activeUser.role === 'freelancer' ? 'Frilanser' : 'Sifarişçi'}
                      </span>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    <MoreVertical className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto chat-scroll p-8 bg-slate-50/30 flex flex-col gap-6">
                  {messages.map((msg) => {
                    const isMe = msg.fromUserId === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`max-w-[75%] lg:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-6 py-4 rounded-2xl shadow-sm relative ${
                            isMe ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                          }`}>
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 px-1">
                            <span className="text-xs text-slate-400 font-medium">{formatTime(msg.createdAt)}</span>
                            {isMe && <Check className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white/70 backdrop-blur-md border-t border-slate-200/80">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-3 bg-slate-100/50 border border-slate-200/80 p-2 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm"
                  >
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Mesaj üçün mətn daxil edin.."
                      className="flex-grow bg-transparent border-none focus:outline-none text-slate-700 font-medium placeholder:text-slate-400 px-4 py-2"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="p-3 text-white bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-100 rounded-xl transition-colors shadow-sm"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">{error}</div>
        )}
      </main>
    </div>
  );
}
