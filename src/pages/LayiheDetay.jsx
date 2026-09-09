import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, Flag, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function LayiheDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { api.getProject(id).then(setProject).catch((err) => setError(err.message)); }, [id]);
  if (error) return <div className="min-h-screen pt-32 text-center text-red-600">{error}</div>;
  if (!project) return <div className="min-h-screen pt-32 text-center text-slate-400">Layihə yüklənir...</div>;
  const like = async () => { const result = await api.likeProject(project.id); setProject({ ...project, likes: result.likes }); };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: project.title, text: project.description, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice('Layihənin linki kopyalandı.');
        window.setTimeout(() => setNotice(''), 2500);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') setNotice('Paylaşmaq mümkün olmadı. Linki əl ilə kopyalayın.');
    }
  };
  return <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4"><main className="max-w-5xl mx-auto">
    <button onClick={() => navigate('/layiheler')} className="flex items-center gap-2 text-slate-600 font-semibold mb-6"><ArrowLeft className="w-5 h-5" /> Layihələrə qayıt</button>
    <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid lg:grid-cols-2">
      <img src={project.image} alt={project.title} className="w-full h-full min-h-[360px] object-cover" />
      <div className="p-7 sm:p-10"><div className="flex items-start justify-between gap-4"><span className="text-sm text-blue-600 font-bold">{project.category}</span><div className="flex gap-2"><button type="button" onClick={share} title="Layihəni paylaş" className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200"><Share2 className="w-4 h-4" /></button><button type="button" onClick={() => navigate(`/sikayet?project=${encodeURIComponent(project.title)}&projectId=${project.id}`)} title="Layihəni şikayət et" className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-200"><Flag className="w-4 h-4" /></button></div></div><h1 className="text-3xl font-black text-slate-900 mt-3">{project.title}</h1><p className="text-slate-500 mt-2">Hazırlayan: {project.author}</p><p className="text-slate-700 leading-relaxed mt-8 whitespace-pre-wrap">{project.description}</p><div className="flex gap-4 mt-8 text-sm text-slate-500"><span><Eye className="inline w-4 h-4" /> {project.views}</span><button onClick={like} className="flex items-center gap-1 hover:text-red-500"><Heart className="w-4 h-4" /> {project.likes}</button><span><MessageCircle className="inline w-4 h-4" /> Portfolio</span></div>{notice && <p role="status" className="mt-4 text-sm font-semibold text-blue-600">{notice}</p>}</div>
    </article>
  </main></div>;
}
