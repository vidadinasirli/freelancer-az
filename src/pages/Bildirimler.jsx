import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Bildirimler() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!user) return;
    api.getNotifications().then(setItems).then(() => api.markNotificationsRead()).catch((err) => setError(err.message));
  }, [user]);
  if (!user) return <div className="min-h-screen pt-32 text-center text-slate-500">Bildirişləri görmək üçün daxil olun.</div>;
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4">
      <main className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8"><div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center"><Bell /></div><div><h1 className="text-3xl font-black text-slate-900">Bildirişlər</h1><p className="text-slate-500">Qəbul edilmiş tapşırıqlar, mesajlar və izləmələr</p></div></div>
        {error && <p className="mb-4 p-3 rounded-xl bg-red-50 text-red-700">{error}</p>}
        <div className="space-y-3">{items.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">Hələ bildiriş yoxdur.</div> : items.map((item) => <article key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-1" /><div><h2 className="font-bold text-slate-900">{item.title}</h2><p className="text-slate-600 mt-1">{item.description}</p><time className="text-xs text-slate-400 mt-2 block">{item.createdAt}</time></div></article>)}</div>
      </main>
    </div>
  );
}
