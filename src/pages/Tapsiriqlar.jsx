import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TiltCard } from '../components/Effects.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { 
  Search, 
  MessageCircle, 
  Eye, 
  Clock, 
  Share2, 
  Flag,
  ArrowLeft,
  Send,
  User,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Briefcase,
  Star,
  Award,
  ShieldCheck,
  Globe,
  Github,
  Twitter,
  Mail,
  Camera,
  Layout,
  Code,
  PenTool,
  Smartphone,
  Server,
  Image as ImageIcon,
  Plus,
  X,
  Loader2
} from 'lucide-react';

function daysAgoFrom(iso) {
  if (!iso) return 0;
  const then = new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const diff = Date.now() - then;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatApplicationData(message) {
  try {
    const value = JSON.parse(message || '{}');
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

function formatApplicationMessage(message) {
  const data = formatApplicationData(message);
  return data?.text || message;
}

const TASK_CATEGORY_OPTIONS = [
  'Veb-Saytların hazırlanması', 'Front-end', 'Back-end', 'iOS', 'Android',
  'Dizayn', 'Logotipin hazırlanması', 'SMM', 'Video montaj', 'Kopiraytinq', 'Tərcümə'
];

export default function Tapsiriqlar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profileData } = useAuth();
  const initialView = location.pathname === '/frilanserler' ? 'freelancers' : 'tasks';
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalPriceType, setProposalPriceType] = useState('iş başına');
  const [proposalDays, setProposalDays] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [taskSearch, setTaskSearch] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [freelancerSearch, setFreelancerSearch] = useState('');
  const [followedFreelancers, setFollowedFreelancers] = useState({});

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [freelancers, setFreelancers] = useState([]);
  const [clubPosts, setClubPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', price: '', categories: [] });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError('');
    try {
      const data = await api.getTasks({ search: taskSearch, category: taskCategory });
      setTasks(data);
    } catch (err) {
      setTasksError(err.message);
    } finally {
      setTasksLoading(false);
    }
  }, [taskSearch, taskCategory]);

  const loadFreelancers = useCallback(async () => {
    try {
      const data = await api.getFreelancers();
      setFreelancers(data.map((profile) => ({
        ...profile,
        name: profile.fullName,
        username: `@${profile.fullName.toLowerCase().replace(/\s+/g, '')}`,
        avatar: profile.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
        title: profile.status || 'Freelancer',
        price: profile.hourlyRate || 0,
        currency: 'AZN',
        priceText: profile.rateType || '-dən başlayır',
        reviews: { pos: '+0', neg: '-0' },
        description: profile.about || 'Profil məlumatı əlavə edilməyib.',
        skills: profile.activityAreas || [],
        stats: { ...(profile.stats || {}), views: profile.stats?.projectViews || 0, customerReviews: { pos: '+0', neg: '-0' }, registration: profile.createdAt || '', lastActive: profile.status || 'Aktiv' },
        coverImage: profile.bannerUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
        portfolio: profile.projects || [],
      })));
    } catch {
      setTasksError('Freelancer siyahısını yükləmək mümkün olmadı.');
    }
  }, []);

  useEffect(() => { loadTasks(); loadFreelancers(); }, [loadTasks, loadFreelancers]);
  useEffect(() => {
    api.getClubPosts().then(setClubPosts).catch(() => setClubPosts([]));
  }, []);

  const visibleFreelancers = freelancers.filter((freelancer) => {
    const query = freelancerSearch.toLowerCase();
    return !query || [freelancer.name, freelancer.title, ...(freelancer.skills || [])]
      .some((value) => value.toLowerCase().includes(query));
  });

  // Navbar-dakı "Tapşırıqlar" / "Freelancerlər" linkləri fərqli route-lardır,
  // amma eyni komponentdən istifadə edir — path dəyişəndə görünüşü sinxronlaşdırırıq.
  React.useEffect(() => {
    setCurrentView(location.pathname === '/frilanserler' ? 'freelancers' : 'tasks');
    setSelectedTask(null);
    setSelectedOwner(null);
    setSelectedFreelancer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const openTaskDetail = async (task) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const full = await api.getTask(task.id);
      setSelectedTask(full);
      setSelectedOwner(await api.getUser(full.ownerId));
    } catch {
      setSelectedTask(task);
    }
  };

  const handleTaskClick = (task) => openTaskDetail(task);

  const handleFreelancerClick = async (freelancer) => {
    try {
      const profile = await api.getUser(freelancer.id);
      setSelectedFreelancer({
        ...freelancer,
        ...profile,
        name: profile.fullName,
        username: `@${(profile.nickname || profile.fullName).toLowerCase().replace(/\s+/g, '')}`,
        title: profile.status || 'Freelancer',
        price: profile.hourlyRate || 0,
        priceText: profile.rateType || '-dən başlayır',
        description: profile.about || 'Profil məlumatı əlavə edilməyib.',
        skills: profile.activityAreas || [],
        coverImage: profile.bannerUrl || freelancer.coverImage,
        portfolio: profile.projects || [],
        stats: { ...(profile.stats || {}), views: profile.stats?.projectViews || 0, customerReviews: { pos: '+0', neg: '-0' }, registration: profile.createdAt || '', lastActive: profile.status || 'Aktiv' },
      });
    } catch {
      setSelectedFreelancer(freelancer);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToTasks = () => { setSelectedTask(null); setSelectedOwner(null); };
  const handleBackToFreelancers = () => setSelectedFreelancer(null);
  const shareTask = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: selectedTask.title, text: selectedTask.description, url });
    else await navigator.clipboard.writeText(url);
  };
  const reportTask = () => navigate(`/sikayet?task=${encodeURIComponent(selectedTask.title)}&taskId=${selectedTask.id}`);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    if (!user) {
      setApplyMessage('Təklif göndərmək üçün əvvəlcə daxil olun.');
      return;
    }
    if (user.role !== 'freelancer') {
      setApplyMessage('Yalnız frilanser hesabları təklif göndərə bilər.');
      return;
    }
    setApplySubmitting(true);
    setApplyMessage('');
    try {
      await api.applyToTask(selectedTask.id, commentText, proposalPrice, proposalPriceType, proposalDays);
      setCommentText('');
      setProposalPrice('');
      setProposalDays('');
      const full = await api.getTask(selectedTask.id);
      setSelectedTask(full);
      setApplyMessage('Təklifiniz göndərildi!');
    } catch (err) {
      setApplyMessage(err.message);
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.title.trim() || !createForm.description.trim()) {
      setCreateError('Başlıq və təsvir tələb olunur.');
      return;
    }
    setCreateSubmitting(true);
    try {
      await api.createTask({
        title: createForm.title,
        description: createForm.description,
        price: Number(createForm.price) || 0,
        currency: 'AZN',
        priceType: 'Sifarişçi büdcəni təyin edib',
        categories: createForm.categories,
      });
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', price: '', categories: [] });
      loadTasks();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const toggleCreateCategory = (cat) => {
    setCreateForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const renderIconForSkill = (skill) => {
    const s = skill.toLowerCase();
    if (s.includes('veb') || s.includes('front') || s.includes('back')) return <Code className="w-4 h-4" />;
    if (s.includes('dizayn') || s.includes('qrafika') || s.includes('loqotip')) return <PenTool className="w-4 h-4" />;
    if (s.includes('ios') || s.includes('android')) return <Smartphone className="w-4 h-4" />;
    if (s.includes('server')) return <Server className="w-4 h-4" />;
    if (s.includes('video') || s.includes('audio') || s.includes('smm')) return <Camera className="w-4 h-4" />;
    return <Layout className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-200 selection:text-blue-900 flex flex-col relative overflow-hidden pt-24">
      
      {/* Global Ambient Background Effects - Premium Look */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-[150px] pointer-events-none z-0"></div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .premium-card {
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .premium-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 30px 60px -20px rgba(37, 99, 235, 0.15), 0 0 20px 0 rgba(37, 99, 235, 0.05);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }
        .text-gradient {
          background: linear-gradient(135deg, #0F172A 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .price-gradient {
          background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .nav-link {
          position: relative;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -4px;
          left: 0;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after, .nav-link.active::after {
          width: 100%;
        }
      `}</style>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
        
        {/* VIEW: TASKS */}
        {currentView === 'tasks' && (
          !selectedTask ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
              <div className="lg:col-span-8 space-y-6">
                <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <h1 className="text-3xl font-black text-slate-900">İş Elanları</h1>
                    {user?.role === 'musteri' && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all"
                      >
                        <Plus className="w-5 h-5" /> Yeni tapşırıq
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} placeholder="Tapşırıq axtarışı..." className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white">
                      <option value="">Bütün kateqoriyalar</option>
                      {TASK_CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>

                  {tasksLoading && (
                    <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" /> Yüklənir...
                    </div>
                  )}
                  {!tasksLoading && tasksError && (
                    <div className="p-4 rounded-xl bg-red-50 text-red-700 font-medium text-sm">{tasksError}</div>
                  )}
                  {!tasksLoading && !tasksError && tasks.length === 0 && (
                    <div className="p-10 text-center text-slate-400">Hələ heç bir tapşırıq yoxdur.</div>
                  )}

                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div 
                        key={task.id} 
                        onClick={() => handleTaskClick(task)}
                        className="premium-card bg-white/80 p-4 sm:p-6 rounded-2xl border border-slate-200 cursor-pointer flex justify-between items-center gap-4"
                      >
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-2 truncate">{task.title}</h3>
                          <p className="text-slate-500 text-sm line-clamp-1">{task.description}</p>
                          <p className="text-slate-400 text-xs mt-2 font-semibold">{task.ownerName} · {daysAgoFrom(task.createdAt)} gün öncə · {task.applicationCount || 0} təklif</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base sm:text-xl font-black price-gradient">
                            {task.price} {task.currency}
                          </div>
                          <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{task.priceType}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filters Box */}
              <div className="lg:col-span-4 space-y-8 sticky top-28 self-start">
                
                <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] sidebar-card">
                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                      Fəaliyyət sahəsi
                    </h3>
                    <div className="space-y-4">
                      {['İnformasiya texnologiyaları', 'Dizayn', 'Media'].map((item, i) => (
                        <label key={i} className="flex items-center gap-4 cursor-pointer group">
                          <div className="w-6 h-6 border-2 border-slate-300 rounded-lg flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-50/50 transition-all shadow-sm"></div>
                          <span className="text-slate-600 font-semibold group-hover:text-slate-900 transition-colors text-lg">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-200/80">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                      Əlavə olaraq
                    </h3>
                    <div className="space-y-4">
                      {['Cavab verilənlər', 'Göstərilən qiymət ilə'].map((item, i) => (
                        <label key={i} className="flex items-center gap-4 cursor-pointer group">
                          <div className="w-6 h-6 border-2 border-slate-300 rounded-lg flex items-center justify-center group-hover:border-indigo-500 group-hover:bg-indigo-50/50 transition-all shadow-sm"></div>
                          <span className="text-slate-600 font-semibold group-hover:text-slate-900 transition-colors text-lg">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Club Posts Box */}
                <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] sidebar-card">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                    <span className="glitch-hover" data-text='"Klub"-da yeni yazılar'>"Klub"-da yeni yazılar</span>
                  </h3>
                  <div className="space-y-6 divide-y divide-slate-200/60">
                    {clubPosts.slice(0, 3).map((post, i) => (
                      <div key={i} className={i !== 0 ? "pt-6 group cursor-pointer" : "group cursor-pointer"}>
                        <div className="flex justify-between text-xs text-blue-500 font-bold mb-3 tracking-wide">
                          <span className="bg-blue-50 px-2 py-1 rounded-md">{post.type}</span>
                          <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{post.author}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors mb-4 leading-snug">{post.title}</h4>
                        <div className="flex items-center gap-5 text-sm text-slate-500 font-semibold">
                          <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> {post.comments} rəy</span>
                          <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" /> {post.views} baxış</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/klub')} className="w-full mt-8 py-4 text-sm font-bold text-slate-700 bg-slate-100/50 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-200/50 shadow-sm hover:shadow-md">
                    Bütün mövzular
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* LEFT COLUMN - TASK DETAILS & COMMENTS */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Header & Search */}
                <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
                  <button 
                    onClick={handleBackToTasks}
                    className="flex items-center gap-3 text-slate-600 hover:text-blue-600 font-bold transition-all glass-panel px-6 py-3 rounded-2xl shadow-sm w-fit hover:shadow-md hover:-translate-x-2 group"
                  >
                    <div className="bg-white p-1 rounded-full group-hover:bg-blue-50 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </div>
                    Bütün tapşırıqlara qayıt
                  </button>
                </div>

                {/* Task Content Card */}
                <div className="glass-panel rounded-3xl p-7 md:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-transparent rounded-full blur-[100px] pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-cyan-400"></div>

                  {/* Actions (Share, Flag) */}
                  <div className="absolute top-10 right-10 flex flex-col gap-4 z-10">
                    <button onClick={shareTask} title="Tapşırığı paylaş" className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1">
                      <Share2 className="w-6 h-6" />
                    </button>
                    <button onClick={reportTask} title="Tapşırığı bildir" className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1">
                      <Flag className="w-6 h-6" />
                    </button>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 pr-24 leading-[1.2] mb-8">{selectedTask.title}</h1>
                  
                  <div className="flex flex-wrap items-center gap-6 mb-12">
                    <div className="bg-white/80 px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
                       <span className="text-4xl font-black price-gradient">{selectedTask.price} {selectedTask.currency}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-800 uppercase tracking-widest px-5 py-3 bg-blue-50 rounded-2xl border border-blue-100/80 shadow-sm">{selectedTask.priceType}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-base text-slate-600 font-semibold mb-12 pb-12 border-b border-slate-200/80">
                    <span className="flex items-center gap-3 bg-white/60 px-5 py-2.5 rounded-2xl border border-slate-200/50 shadow-sm"><MessageCircle className="w-5 h-5 text-blue-500" /> {(selectedTask.applications || []).length} cavab</span>
                    <span className="flex items-center gap-3 bg-white/60 px-5 py-2.5 rounded-2xl border border-slate-200/50 shadow-sm"><Eye className="w-5 h-5 text-indigo-500" /> {selectedTask.views || 0} baxış</span>
                    <span className="flex items-center gap-3 bg-white/60 px-5 py-2.5 rounded-2xl border border-slate-200/50 shadow-sm"><Clock className="w-5 h-5 text-emerald-500" /> {daysAgoFrom(selectedTask.createdAt)} gün öncə</span>
                    {selectedTask.ownerName && (
                      <span className="flex items-center gap-3 bg-white/60 px-5 py-2.5 rounded-2xl border border-slate-200/50 shadow-sm"><User className="w-5 h-5 text-slate-500" /> {selectedTask.ownerName}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 mb-10">
                    {(selectedTask.categories || []).map((cat, idx) => (
                      <span key={idx} className="px-6 py-3 bg-slate-100/80 text-slate-700 text-sm font-bold rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-default shadow-sm">
                        {cat}
                      </span>
                    ))}
                  </div>

                  <div className="prose prose-slate max-w-none text-slate-700 leading-loose text-lg font-medium">
                    <p>{selectedTask.description}</p>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="glass-panel rounded-[2.5rem] p-12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-bl-full -z-10"></div>
                  
                  <h3 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    Təkliflər ({(selectedTask.applications || []).length})
                  </h3>

                  {/* Comment / Proposal Input */}
                  <form onSubmit={handleAddComment} className="mb-12 relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white rounded-2xl p-2 border border-slate-200 shadow-sm">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Müştəriyə öz təklifini və ya layihə haqqında rəyini yaz..."
                        className="w-full p-6 bg-transparent resize-none h-40 focus:outline-none text-slate-700 font-medium text-lg placeholder:text-slate-400"
                      ></textarea>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 border-t border-slate-100">
                      <input type="number" min="0" value={proposalPrice} onChange={(e) => setProposalPrice(e.target.value)} placeholder="Təklif qiyməti" className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
                      <select value={proposalPriceType} onChange={(e) => setProposalPriceType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none bg-white"><option>iş başına</option><option>saatlıq</option><option>günlük</option></select>
                      <input type="number" min="1" value={proposalDays} onChange={(e) => setProposalDays(e.target.value)} placeholder="Gün sayı" className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
                       </div>
                       <div className="flex justify-between items-center p-2">
                        {applyMessage && <span className="text-sm font-semibold text-blue-600 px-2">{applyMessage}</span>}
                        <button 
                          type="submit" 
                          disabled={!commentText.trim() || applySubmitting}
                          className="ml-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-3 hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                        >
                          {applySubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Göndər
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Proposals List */}
                  <div className="space-y-6">
                    {(selectedTask.applications || []).map((app) => (
                      <div key={app.id} className="flex gap-6 p-8 bg-white/60 rounded-3xl border border-slate-200/60 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          {(app.freelancerName || '?').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                            <h4 className="font-bold text-slate-900 text-xl">{app.freelancerName}</h4>
                            <span className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${app.status === 'qəbul edilib' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100/80 text-slate-500 border-slate-200'}`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium leading-relaxed text-sm">{formatApplicationMessage(app.message)}</p>
                          {formatApplicationData(app.message)?.price > 0 && <p className="text-xs text-blue-600 mt-2 font-bold">{formatApplicationData(app.message).price} AZN · {formatApplicationData(app.message).priceType} · {formatApplicationData(app.message).deliveryDays || '-'} gün</p>}
                          {user && user.id === selectedTask.ownerId && app.status !== 'qəbul edilib' && (
                            <button
                              onClick={async () => {
                                await api.acceptApplication(selectedTask.id, app.id);
                                const full = await api.getTask(selectedTask.id);
                                setSelectedTask(full);
                              }}
                              className="mt-4 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
                            >
                              Qəbul et
                            </button>
                          )}
                          {user && user.id !== selectedTask.ownerId && (
                            <button
                              onClick={() => navigate(`/mesajlar?to=${app.freelancerId}`)}
                              className="mt-4 px-5 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                            >
                              Mesaj göndər
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN - CLIENT DETAILS */}
              <div className="lg:col-span-4 space-y-8 sticky top-28 self-start">
                <div className="glass-panel rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] overflow-hidden border-2 border-white/50">
                  
                  {/* Profile Header */}
                  <div className="p-10 flex flex-col items-center text-center border-b border-slate-200/80 bg-gradient-to-b from-white/80 to-transparent relative overflow-hidden">
                     {/* Background Glow */}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 rounded-full blur-[60px] pointer-events-none"></div>

                     <div className="relative mb-6 group">
                       <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-amber-300 via-yellow-400 to-orange-400 p-1.5 shadow-xl shadow-yellow-500/20 group-hover:rotate-6 group-hover:scale-105 transition-all duration-500">
                         <div className="w-full h-full bg-white rounded-[1.6rem] flex items-center justify-center text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-orange-600">
                           {(selectedOwner?.fullName || selectedTask.ownerName || 'M').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                         </div>
                       </div>
                     </div>
                     <h2 className="text-2xl font-black text-slate-900 mb-2 relative z-10">{selectedOwner?.fullName || selectedTask.ownerName || 'Sifarişçi'}</h2>
                     <div className="text-sm font-black text-slate-400 uppercase tracking-[0.25em] relative z-10">Müştəri</div>
                  </div>

                  {/* Stats Sections */}
                  <div className="p-10 space-y-10 bg-white/40">
                    
                    {/* User Stats */}
                    <div>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-3">
                        <div className="p-1.5 bg-slate-200/50 rounded-lg"><User className="w-4 h-4 text-slate-500" /></div>
                        İstifadəçi statistikası
                      </h3>
                      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-slate-600 font-bold">Baxış sayı</span>
                        <span className="font-black text-slate-900 text-xl">{selectedOwner?.stats?.projectViews || 0}</span>
                      </div>
                    </div>

                    {/* Client Stats Detailed */}
                    <div className="pt-8 border-t border-slate-200/80">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-3">
                        <div className="p-1.5 bg-slate-200/50 rounded-lg"><CheckCircle2 className="w-4 h-4 text-slate-500" /></div>
                        Müştərinin statistikası
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label: "Tamamlanmış sifarişlər", val: selectedOwner?.stats?.completedOrders || 0 },
                          { label: "Aktiv tapşırıqlar", val: selectedOwner?.stats?.activeOrders || 0 },
                          { label: "Arbitraj işləri", val: selectedOwner?.stats?.conflictJobs || 0 }
                        ].map((stat, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-white/50 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                            <span className="text-slate-600 font-semibold">{stat.label}</span>
                            <span className="font-black text-slate-900 bg-white shadow-sm border border-slate-200 px-4 py-1.5 rounded-xl">{stat.val}</span>
                          </div>
                        ))}
                        
                        {/* Reviews specific styling */}
                        <div className="flex justify-between items-center p-4 bg-white/50 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                          <span className="text-slate-600 font-semibold">Frilanserlərin rəyi</span>
                          <div className="font-black bg-white shadow-sm border border-slate-200 px-4 py-1.5 rounded-xl flex items-center gap-1">
                            <span className="text-emerald-500">+0</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-red-500">-0</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Stats */}
                    <div className="pt-8 border-t border-slate-200/80 space-y-3">
                       <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl">
                          <span className="text-slate-500 font-semibold">İzləyicilər</span>
                          <span className="font-bold text-slate-800">{selectedOwner?.followers || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl">
                          <span className="text-slate-500 font-semibold">Status</span>
                          <span className="font-bold text-slate-800">{selectedOwner?.status || 'Aktiv'}</span>
                        </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          )
        )}

        {/* VIEW: FREELANCERS */}
        {currentView === 'freelancers' && (
          !selectedFreelancer ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
              
              {/* LEFT COLUMN - FREELANCERS LIST */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Header & Search */}
                <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100/40 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                  
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h1 className="text-3xl font-black text-gradient tracking-tight mb-2">Frilanserlər ({freelancers.length})</h1>
                      <p className="text-slate-500 font-medium text-lg">Layihəniz üçün ən yaxşı <span className="text-blue-600 font-bold">mütəxəssisləri</span> tapın</p>
                    </div>
                  </div>
                  
                  <div className="flex w-full bg-white/90 backdrop-blur border border-slate-200/80 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm group">
                    <div className="flex items-center pl-6 pr-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Search className="w-6 h-6" />
                    </div>
                    <input 
                      type="text" 
                      value={freelancerSearch}
                      onChange={(e) => setFreelancerSearch(e.target.value)}
                      placeholder="Frilanser axtarışı..." 
                      className="w-full py-4 px-3 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-medium text-sm sm:text-base"
                    />
                    <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-12 font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]">
                      Axtar
                    </button>
                  </div>
                </div>

                {/* Freelancers Mapping */}
                <div className="space-y-6">
                  {visibleFreelancers.map((freelancer) => (
                    <div 
                      key={freelancer.id} 
                      onClick={() => handleFreelancerClick(freelancer)}
                      className="premium-card bg-gradient-to-br from-blue-50/80 to-white/90 backdrop-blur rounded-3xl p-8 cursor-pointer group relative overflow-hidden border border-blue-100/50"
                    >
                      {/* Hover Effects */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-[150%] group-hover:animate-[shine_1.5s_ease-in-out] pointer-events-none z-0"></div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-[40px] group-hover:bg-blue-400/20 transition-colors pointer-events-none"></div>

                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative z-10">
                        
                        {/* Avatar & Info */}
                        <div className="flex items-start gap-5 w-full sm:w-auto">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-tr from-blue-400 to-cyan-400 p-1 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                              <div className="w-full h-full bg-white rounded-[1.3rem] flex items-center justify-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-cyan-600">
                                {freelancer.avatar}
                              </div>
                            </div>
                            {freelancer.isVerified && (
                              <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Verified">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                            )}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full text-xs font-black shadow-sm border border-slate-100 whitespace-nowrap">
                              <span className="text-emerald-500">{freelancer.reviews.pos}</span>
                              <span className="text-slate-300">/</span>
                              <span className="text-red-500">{freelancer.reviews.neg}</span>
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {freelancer.name}
                              </h3>
                            </div>
                            <p className="text-slate-500 font-medium mb-3">{freelancer.title}</p>
                            
                            <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2 max-w-2xl">
                              {freelancer.description}
                            </p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-left sm:text-right bg-white/60 p-4 rounded-2xl border border-blue-50 shadow-sm shrink-0 w-full sm:w-auto">
                          <div className="text-2xl font-black price-gradient tracking-tight">
                            {freelancer.price} {freelancer.currency}
                          </div>
                          <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{freelancer.priceText}</div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mt-6 relative z-10 pl-0 sm:pl-25 ml-0 sm:ml-[100px]">
                        {freelancer.skills.map((skill, idx) => (
                          <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-colors">
                            {renderIconForSkill(skill)}
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN - FILTERS & CLUB */}
              <div className="lg:col-span-4 space-y-8 sticky top-28 self-start">
                
                {/* Filters Box */}
                <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] sidebar-card">
                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                      Fəaliyyət sahəsi
                    </h3>
                    <div className="space-y-4">
                      {['İnformasiya texnologiyaları', 'Dizayn', 'Media'].map((item, i) => (
                        <label key={i} className="flex items-center gap-4 cursor-pointer group">
                          <div className="w-6 h-6 border-2 border-slate-300 rounded-lg flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-50/50 transition-all shadow-sm"></div>
                          <span className="text-slate-600 font-semibold group-hover:text-slate-900 transition-colors text-lg">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Club Posts Box */}
                <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] sidebar-card">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                    <span className="glitch-hover" data-text='"Klub"-da yeni yazılar'>"Klub"-da yeni yazılar</span>
                  </h3>
                  <div className="space-y-6 divide-y divide-slate-200/60">
                    {clubPosts.slice(0, 3).map((post, i) => (
                      <div key={i} className={i !== 0 ? "pt-6 group cursor-pointer" : "group cursor-pointer"}>
                        <div className="flex justify-between text-xs text-blue-500 font-bold mb-3 tracking-wide">
                          <span className="bg-blue-50 px-2 py-1 rounded-md">{post.type}</span>
                          <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{post.author}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors mb-4 leading-snug">{post.title}</h4>
                        <div className="flex items-center gap-5 text-sm text-slate-500 font-semibold">
                          <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> {post.comments} rəy</span>
                          <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" /> {post.views} baxış</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/klub')} className="w-full mt-8 py-4 text-sm font-bold text-slate-700 bg-slate-100/50 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-200/50 shadow-sm hover:shadow-md">
                    Bütün mövzular
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Back Button - Top Full Width */}
              <div className="lg:col-span-12">
                <button 
                  onClick={handleBackToFreelancers}
                  className="flex items-center gap-3 text-slate-600 hover:text-blue-600 font-bold transition-all glass-panel px-6 py-3 rounded-2xl shadow-sm w-fit hover:shadow-md hover:-translate-x-2 group"
                >
                  <div className="bg-white p-1 rounded-full group-hover:bg-blue-50 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </div>
                  Bütün frilanserlərə qayıt
                </button>
              </div>

              {/* LEFT COLUMN - PROFILE DETAILS */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Cover & Header Card */}
                <div className="glass-panel rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] relative">
                  {/* Cover Image */}
                  <div className="h-64 md:h-80 w-full relative overflow-hidden group">
                    <img 
                      src={selectedFreelancer.coverImage} 
                      alt="Cover" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      {selectedFreelancer.onlineStatus?.isOnline ? 'Onlayn' : 'Offline'}
                    </div>
                  </div>

                  {/* Profile Info Overlayed */}
                  <div className="relative px-8 md:px-12 pb-10 pt-4 sm:pt-0">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:-mt-20 relative z-10 mb-6">
                      {/* Avatar */}
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-blue-400 to-cyan-400 p-1.5 shadow-2xl shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300 bg-white">
                           <div className="w-full h-full bg-white rounded-[1.6rem] flex items-center justify-center text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-cyan-600">
                             {selectedFreelancer.avatar}
                           </div>
                        </div>
                        {selectedFreelancer.isVerified && (
                          <div className="absolute -top-3 -right-3 bg-blue-500 text-white p-2 rounded-full border-4 border-white shadow-lg" title="Verified">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Name & Title */}
                      <div className="text-center sm:text-left flex-1 pb-2">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-1 sm:text-white sm:drop-shadow-lg flex items-center justify-center sm:justify-start gap-3">
                          {selectedFreelancer.name}
                        </h1>
                        <p className="text-lg text-slate-500 sm:text-slate-200 font-medium font-medium">{selectedFreelancer.title}</p>
                        <p className="text-sm font-bold text-blue-500 sm:text-blue-300 mt-1">{selectedFreelancer.username}</p>
                      </div>

                      {/* Message Button */}
                      <div className="pb-2">
                         <button onClick={() => navigate(`/mesajlar?to=${selectedFreelancer.id}`)} className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:-translate-y-1 group border border-slate-100 sm:border-transparent">
                            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Mesaj yaz
                         </button>
                         {user && user.id !== selectedFreelancer.id && <button onClick={async () => { const result = await api.followUser(selectedFreelancer.id); setFollowedFreelancers({ ...followedFreelancers, [selectedFreelancer.id]: result.following }); }} className="mt-2 w-full bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold">{followedFreelancers[selectedFreelancer.id] ? 'İzlənilir' : 'İzlə'}</button>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Portfolio Section */}
                {selectedFreelancer.portfolio.length > 0 && (
                  <div className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-black text-slate-900">Portfolio</h2>
                      <button className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                        Hamısına bax
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {selectedFreelancer.portfolio.map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                          <div className="aspect-square rounded-2xl p-6 relative overflow-hidden flex flex-col justify-end shadow-sm group-hover:shadow-md transition-shadow bg-slate-100">
                            {item.image ? <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:scale-110 transition-transform duration-500"><ImageIcon className="w-24 h-24 text-blue-300" /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 z-10">
                              <Eye className="w-3 h-3" /> {item.views || 0}
                            </div>
                            <h3 className="relative z-10 text-white font-black text-xl drop-shadow-md">{item.title}</h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* About Section */}
                <div className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-sm">
                  <h2 className="text-2xl font-black text-slate-900 mb-6">Haqqında</h2>
                  
                  <div className="space-y-4 mb-8 text-slate-700 font-medium text-lg leading-relaxed">
                     <p><strong className="text-slate-900">İşin qiyməti:</strong> {selectedFreelancer.price} {selectedFreelancer.currency} {selectedFreelancer.priceText}</p>
                     <p><strong className="text-slate-900">Professional təcrübə:</strong> {selectedFreelancer.experience}</p>
                     <div className="mt-6 pt-6 border-t border-slate-100">
                        {selectedFreelancer.description.split('\n').map((para, i) => (
                           <p key={i} className="mb-4">{para}</p>
                        ))}
                     </div>
                  </div>

                  <div>
                     <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                        Fəaliyyət sahəsi
                     </h3>
                     <div className="flex flex-wrap gap-3">
                        {selectedFreelancer.skills.map((skill, idx) => (
                          <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm cursor-default">
                            {renderIconForSkill(skill)}
                            {skill}
                          </span>
                        ))}
                      </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-sm text-center min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
                   <div className="absolute top-8 left-8">
                     <h2 className="text-2xl font-black text-slate-900">Rəylər (0)</h2>
                   </div>
                   <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner mt-12">
                     <Search className="w-12 h-12 text-slate-300" />
                   </div>
                   <h3 className="text-2xl font-bold text-slate-400">Rəy yoxdur</h3>
                </div>

              </div>

              {/* RIGHT COLUMN - STATS WIDGETS */}
              <div className="lg:col-span-4 space-y-6 sticky top-28 self-start">
                
                {/* Stats Box */}
                <div className="glass-panel rounded-[2rem] shadow-sm overflow-hidden">
                  <div className="p-8 space-y-8">
                    
                    {/* General Stat */}
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Statistika</h3>
                      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-slate-600 font-bold">Baxış sayı</span>
                        <span className="font-black text-slate-900 text-lg">{selectedFreelancer.stats.views}</span>
                      </div>
                    </div>

                    {/* Freelancer Specific Stats */}
                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Frilanserin statistikası</h3>
                      <div className="space-y-2">
                        {[
                          { label: "Tamamlanmış sifarişlər", val: selectedFreelancer.stats.completedOrders },
                          { label: "Arbitraj işləri", val: selectedFreelancer.stats.conflictJobs || 0 }
                        ].map((stat, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                            <span className="text-slate-600 font-semibold">{stat.label}</span>
                            <span className="font-black text-slate-900 bg-white shadow-sm border border-slate-100 px-3 py-1 rounded-lg">{stat.val}</span>
                          </div>
                        ))}
                        
                        {/* Reviews */}
                        <div className="flex justify-between items-center p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                          <span className="text-slate-600 font-semibold">Müştərilərin rəyi</span>
                          <div className="font-black bg-white shadow-sm border border-slate-100 px-3 py-1 rounded-lg flex items-center gap-1 text-sm">
                            <span className="text-emerald-500">{selectedFreelancer.stats.customerReviews.pos}</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-red-500">{selectedFreelancer.stats.customerReviews.neg}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="pt-6 border-t border-slate-100 space-y-3 text-sm">
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                          <span className="text-slate-500 font-semibold">İzləyicilər</span>
                          <span className="font-bold text-slate-800">{selectedFreelancer.followers || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                          <span className="text-slate-500 font-semibold">Status</span>
                          <span className={`font-bold ${selectedFreelancer.onlineStatus?.isOnline ? 'text-emerald-600' : 'text-slate-800'}`}>{selectedFreelancer.onlineStatus?.isOnline ? 'Onlayn' : 'Offline'}</span>
                        </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )
        )}
      </main>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-6">Yeni tapşırıq yarat</h2>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Başlıq</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Məs: Veb saytın hazırlanması"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Təsvir</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                  placeholder="Tapşırığın detallarını yazın..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Büdcə (AZN)</label>
                <input
                  type="number"
                  min="0"
                  value={createForm.price}
                  onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Kateqoriyalar</label>
                <div className="flex flex-wrap gap-2">
                  {TASK_CATEGORY_OPTIONS.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCreateCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        createForm.categories.includes(cat)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              {createError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">{createError}</div>
              )}
              <button
                type="submit"
                disabled={createSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60"
              >
                {createSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Tapşırığı dərc et
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}