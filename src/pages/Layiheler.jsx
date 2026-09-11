import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Eye, Heart, Loader2, MessageCircle, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const CATEGORIES = ['İnformasiya texnologiyaları', 'Dizayn', 'Media'];

export default function Layiheler() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getProjects({ search, category }).then((data) => active && setProjects(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [search, category]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-7xl mx-auto py-8"><div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section className="xl:col-span-9 space-y-6">
          <header className="bg-white/80 border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-5"><h1 className="text-2xl sm:text-3xl font-black text-slate-900">Layihələr <span className="text-blue-600">({projects.length})</span></h1><span className="text-sm text-slate-500">Canlı portfolio axtarışı</span></div>
            <div className="relative z-30 flex items-center bg-white border border-slate-200 rounded-2xl overflow-visible focus-within:ring-2 focus-within:ring-blue-500/20">
              <Search className="ml-4 w-5 h-5 text-slate-400 shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Layihə və ya müəllif axtarışı..." className="w-full min-w-0 px-3 py-4 outline-none text-sm sm:text-base" />
              <div className="relative shrink-0 border-l border-slate-200">
                <button type="button" onClick={() => setCategoryMenuOpen((open) => !open)} className="h-14 px-4 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50">
                  <SlidersHorizontal className="w-4 h-4" /><span className="max-w-24 truncate">{category || 'Kateqoriya'}</span><ChevronDown className={`w-4 h-4 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {categoryMenuOpen && <div className="absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <p className="px-3 py-2 text-[11px] uppercase tracking-widest text-slate-400 font-black">Kateqoriya seç</p>
                  {['', ...CATEGORIES].map((item) => <button key={item || 'all'} type="button" onClick={() => { setCategory(item); setCategoryMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold ${category === item ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>{item || 'Bütün kateqoriyalar'}{category === item && <Check className="w-4 h-4" />}</button>)}
                </div>}
              </div>
            </div>
          </header>
          {loading && <div className="py-16 flex justify-center text-blue-600"><Loader2 className="animate-spin" /></div>}
          {error && <div className="p-4 rounded-xl bg-red-50 text-red-700">{error}</div>}
          {!loading && !error && projects.length === 0 && <div className="py-16 text-center text-slate-500">Axtarışa uyğun layihə tapılmadı.</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{projects.map((project) => <article key={project.id} onClick={() => navigate(`/layiheler/${project.id}`)} className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer"><div className="aspect-square overflow-hidden bg-slate-100"><img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div><div className="p-4"><div className="flex justify-between gap-3"><h2 className="font-bold text-slate-900 line-clamp-2">{project.title}</h2><Heart className="w-5 h-5 text-slate-300 shrink-0" /></div><p className="text-sm text-slate-500 mt-1">{project.author}</p><div className="flex items-center gap-4 text-xs text-slate-400 mt-4"><span className="text-blue-600">{project.category}</span><span className="flex items-center gap-1"><Eye className="w-4 h-4" />{project.views}</span><span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{project.likes}</span></div></div></article>)}</div>
        </section>
        <aside className="xl:col-span-3 self-start bg-white/80 border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm xl:sticky xl:top-28"><h2 className="font-bold text-slate-900 flex items-center gap-2 mb-5"><Filter className="w-5 h-5 text-blue-600" /> Kateqoriya</h2><div className="space-y-3"><button onClick={() => setCategory('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${!category ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>Hamısı</button>{CATEGORIES.map((item) => <button key={item} onClick={() => setCategory(item)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${category === item ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>{item}</button>)}</div></aside>
      </div></main>
    </div>
  );
}
