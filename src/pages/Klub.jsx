import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Eye, Loader2, MessageCircle, Search, Send, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

function daysAgo(value) {
  return value ? Math.max(0, Math.floor((Date.now() - new Date(value.replace(' ', 'T') + 'Z')) / 86400000)) : 0;
}

export default function Klub() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [comment, setComment] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('müzakirə');
  const [postFile, setPostFile] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getClubPosts(search).then((data) => active && setPosts(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [search]);

  const openPost = async (post) => {
    try {
      setSelected(await api.getClubPost(post.id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { setError(err.message); }
  };

  const createPost = async (event) => {
    event.preventDefault();
    if (!user) return setError('Yazı paylaşmaq üçün daxil olun.');
    try {
      const uploaded = postFile ? await api.uploadMedia(postFile) : null;
      await api.createClubPost({ title: postTitle, content: postContent, type: postType, tags: ['Müxtəlif'], mediaUrl: uploaded?.url || '' });
      setPostTitle(''); setPostContent(''); setPostType('müzakirə'); setPostFile(null); setShowComposer(false); setPosts(await api.getClubPosts(search));
    } catch (err) { setError(err.message); }
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!user) return setError('Rəy yazmaq üçün daxil olun.');
    if (!comment.trim()) return;
    try { await api.addClubComment(selected.id, comment); setComment(''); openPost(selected); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 px-4 sm:px-6 lg:px-8">
      <main className="max-w-7xl mx-auto py-8">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        {!selected ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-8 space-y-5">
              <header className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm">
                <div className="flex justify-between items-center gap-3 mb-5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Klub <span className="text-blue-600">({posts.length})</span></h1>
                  <button onClick={() => setShowComposer((value) => !value)} className="text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-xl">Yazı paylaş</button>
                </div>
                {showComposer && <form onSubmit={createPost} className="space-y-3 mb-5 p-4 bg-blue-50 rounded-2xl"><input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} required placeholder="Başlıq" className="w-full px-3 py-2 rounded-lg border border-slate-200" /><select value={postType} onChange={(event) => setPostType(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"><option value="müzakirə">Müzakirə</option><option value="sual">Sual</option><option value="elan">Elan</option><option value="təcrübə">Təcrübə</option></select><textarea value={postContent} onChange={(event) => setPostContent(event.target.value)} required placeholder="Məzmun" className="w-full px-3 py-2 rounded-lg border border-slate-200 min-h-24" /><input type="file" accept="image/*,video/*,audio/*,application/pdf" onChange={(event) => setPostFile(event.target.files?.[0] || null)} className="w-full text-sm" /><button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold">Dərc et</button></form>}
                <label className="flex items-center border border-slate-200 rounded-xl overflow-hidden"><Search className="ml-4 w-5 h-5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Post axtarışı" className="w-full min-w-0 px-3 py-3 outline-none" /></label>
              </header>
              {loading ? <div className="py-16 flex justify-center text-blue-600"><Loader2 className="animate-spin" /></div> : posts.map((post) => <article key={post.id} onClick={() => openPost(post)} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg sm:text-xl font-bold text-slate-900">{post.title}</h2><span className="text-xs uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">{post.type}</span></div><div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-4"><span><MessageCircle className="inline w-4 h-4" /> {post.comments} rəy</span><span><Eye className="inline w-4 h-4" /> {post.views} baxış</span><span><Clock className="inline w-4 h-4" /> {daysAgo(post.createdAt)} gün öncə</span></div><p className="text-slate-500 mt-4 line-clamp-2">{post.content}</p>{post.mediaUrl && (post.mediaUrl.match(/\.(mp4|webm)$/i) ? <video src={post.mediaUrl} controls className="mt-4 max-h-64 w-full rounded-xl" /> : <img src={post.mediaUrl} alt="" className="mt-4 max-h-64 w-full rounded-xl object-cover" />)}</article>)}
            </section>
            <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 self-start lg:sticky lg:top-28"><h2 className="font-bold text-slate-900 mb-5">Son mövzular</h2>{posts.slice(0, 5).map((post) => <button key={post.id} onClick={() => openPost(post)} className="block text-left w-full py-3 border-b border-slate-100"><span className="font-semibold text-sm text-slate-700">{post.title}</span><span className="block text-xs text-slate-400 mt-1">{post.comments} rəy · {post.views} baxış</span></button>)}</aside>
          </div>
        ) : (
          <div className="max-w-4xl"><button onClick={() => setSelected(null)} className="flex items-center gap-2 mb-5 text-slate-600 font-semibold"><ArrowLeft className="w-5 h-5" /> Kluba qayıt</button><article className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-9 shadow-sm"><div className="flex justify-between gap-4"><div><h1 className="text-2xl sm:text-3xl font-black text-slate-900">{selected.title}</h1><p className="text-sm text-slate-500 mt-2">{selected.author} · {daysAgo(selected.createdAt)} gün öncə</p></div><button title="Paylaş" onClick={() => navigator.clipboard?.writeText(window.location.href)} className="p-2 h-10 border border-slate-200 rounded-lg"><Share2 className="w-5 h-5" /></button></div><div className="flex gap-4 text-sm text-slate-500 my-6 pb-5 border-b"><span><Eye className="inline w-4 h-4" /> {selected.views}</span><span><MessageCircle className="inline w-4 h-4" /> {selected.commentsList?.length || 0}</span></div><p className="whitespace-pre-wrap leading-relaxed text-slate-700">{selected.content}</p>{selected.mediaUrl && (selected.mediaUrl.match(/\.(mp4|webm)$/i) ? <video src={selected.mediaUrl} controls className="mt-6 max-h-96 w-full rounded-xl" /> : <img src={selected.mediaUrl} alt="" className="mt-6 max-h-96 w-full rounded-xl object-contain" />)}</article><section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 mt-5"><h2 className="text-xl font-bold mb-5">Rəylər ({selected.commentsList?.length || 0})</h2><form onSubmit={addComment} className="flex gap-2 mb-7"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Rəyinizi yazın..." className="flex-1 min-w-0 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20" /><button className="p-3 bg-blue-600 text-white rounded-xl" title="Göndər"><Send className="w-5 h-5" /></button></form><div className="space-y-4">{selected.commentsList?.map((item) => <div key={item.id} className="border-t pt-4"><b>{item.author}</b><p className="text-slate-600 mt-1">{item.text}</p></div>)}</div></section></div>
        )}
      </main>
    </div>
  );
}
