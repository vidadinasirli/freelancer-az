import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { 
  MessageCircle, 
  Edit, 
  Share2, 
  Plus, 
  CheckCircle2, 
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  List,
  Maximize,
  UploadCloud,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';

// --- MOCK DATA ---
const CATEGORIES = {
  it: { 
    id: 'it', 
    label: 'İnformasiya texnologiyaları', 
    items: ['Veb-Saytların hazırlanması', 'Back-end', 'Front-end', 'iOS', 'Android', 'Desktop soft', 'Bot və məlumat parsinqi', 'Oyun yaradılması', '1C proqramlaşdırma', 'Skriptlər və plaginlər', 'Kompüter şəbəkələri', 'Serverlər', 'Verilənlər bazası', 'Müxtəlif'] 
  },
  design: { 
    id: 'design', 
    label: 'Dizayn', 
    items: ['Logotipin hazırlanması', 'Şəkil və illüstrasiyalar', 'Poliqrafiya', 'Banner', 'Vektor qrafika', 'Brandbook', 'Təqdimatlar', 'Animasiya', 'İnteryer Dizayn', 'Eksteryer Dizayn', 'Landşaft Dizayn', 'Müxtəlif'] 
  },
  media: { 
    id: 'media', 
    label: 'Media', 
    items: ['Kopiraytinq', 'Video montajı', 'Audio', 'Məqalələr və xəbərlər', 'Adlandırma və şüarlar', 'Tərcümə', 'Məqalələr, diplomlar, sərbəst işlər', 'Məzmunun idarəedilməsi', 'SMM', 'SEO', 'Müxtəlif'] 
  }
};

export default function Profil() {
  const { user, profileData } = useAuth();
  const navigate = useNavigate();
  const [displayProfile, setDisplayProfile] = useState(profileData);
  const [view, setView] = useState('profile'); // 'profile' or 'add-portfolio'
  const [activeCategory, setActiveCategory] = useState('it');
  const [portfolio, setPortfolio] = useState({ title: '', description: '', category: 'Dizayn', imageUrl: '', mediaFile: null });
  const [portfolioMessage, setPortfolioMessage] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (profileData?.id) api.getUser(profileData.id).then(setDisplayProfile).catch(() => setDisplayProfile(profileData));
  }, [profileData]);

  useEffect(() => {
    if (profileData?.id) api.getProjects({ ownerId: profileData.id }).then(setProjects).catch(() => {});
  }, [profileData?.id]);

  const handlePortfolioFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPortfolio((current) => ({ ...current, mediaFile: file, imageUrl: URL.createObjectURL(file) }));
  };

  const handlePortfolioSubmit = async (event) => {
    event.preventDefault();
    if (!portfolio.title.trim() || !portfolio.description.trim() || !portfolio.mediaFile) {
      setPortfolioMessage('Başlıq, təsvir və fayl əlavə edin.');
      return;
    }
    try {
      setPortfolioMessage('Fayl yüklənir...');
      const uploaded = await api.uploadMedia(portfolio.mediaFile);
      await api.createProject({ title: portfolio.title, description: portfolio.description, category: portfolio.category, imageUrl: uploaded.url });
      setPortfolioMessage('Portfolio layihəsi əlavə edildi.');
      setProjects(await api.getProjects({ ownerId: profileData.id }));
      setPortfolio({ title: '', description: '', category: 'Dizayn', imageUrl: '', mediaFile: null });
    } catch (error) {
      setPortfolioMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-200 selection:text-blue-900 flex flex-col relative overflow-hidden pt-24">
      
      {/* Global Ambient Background Effects - Premium Look */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-400/10 blur-[150px] pointer-events-none z-0"></div>

      {}
      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.9);
        }
        .hero-pattern {
          background-color: #94a3b8;
          background-image: radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 10px, transparent 10px), radial-gradient(circle at 0 0, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 10px, transparent 10px);
          background-size: 40px 40px;
        }
        /* Custom Scrollbar for inner elements if needed */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 20px;
        }
      `}</style>

      {/* Main Content Container */}
      <main className="flex-grow max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10 flex flex-col">
        
        {view === 'profile' ? (
          /* =========================================
             PROFILE VIEW
             ========================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-500">
            
            {/* LEFT COLUMN - MAIN PROFILE INFO */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Hero Banner Card */}
              <div className="glass-panel rounded-3xl overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 relative">
                
                {/* Banner Background */}
                <div className="h-64 hero-pattern relative" style={displayProfile.bannerUrl ? { backgroundImage: `url(${displayProfile.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                  {/* Decorative skyline silhouette mockup using CSS */}
                  <div className="absolute bottom-0 left-0 w-full h-32 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCAxMDBMMCA4MEwxMCA4MEwxMCA2MEwyMCA2MEwyMCA5MEwzMCA5MEwzMCA1MEw0MCA1MEw0MCA3MEw1MCA3MEw1MCA0MEw2MCA0MEw2MCA4MEw3MCA4MEw3MCAzMEw4MCAzMEw4MCA5MEw5MCA5MEw5MCAxMDBaIiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat-x bg-[length:100px_100%]"></div>
                  
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <span className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-bold shadow-sm border border-white/30">
                      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                      Online
                    </span>
                  </div>

                  {/* Banner Action Buttons (Bottom Right) */}
                  <div className="absolute bottom-6 right-6 flex items-center gap-3">
                    <button onClick={() => navigate('/kabinet?tab=personal_info')} className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all border border-white/30 shadow-sm">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all border border-white/30 shadow-sm">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Profile Details Area */}
                <div className="px-8 pb-8 pt-0 relative">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    
                    {/* Avatar (Overlapping banner) */}
                    <div className="w-32 h-32 rounded-3xl bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center font-bold text-slate-400 text-4xl -mt-16 relative z-10 overflow-hidden">
                      {displayProfile.avatarUrl ? <img src={displayProfile.avatarUrl} alt={displayProfile.fullName} className="w-full h-full object-cover" /> : <UserIconPlaceholder />}
                    </div>

                    <div className="flex-1 pt-4">
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black text-slate-900">{displayProfile.fullName || user?.fullName || 'İstifadəçi'}</h1>
                      </div>
                      <p className="text-slate-500 font-medium mb-4">@{(displayProfile.nickname || displayProfile.fullName || 'istifadeci').toLowerCase().replace(/\s+/g, '')}</p>
                      
                      {user?.id !== profileData?.id && <button onClick={() => navigate(`/mesajlar?to=${profileData.id}`)} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-5 py-2.5 rounded-xl transition-colors border border-blue-200/50 shadow-sm">
                        <MessageCircle className="w-5 h-5" />
                        Mesajlar
                      </button>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Section */}
              <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Portfolio</h2>
                  <button onClick={() => navigate('/layiheler')} className="text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors">
                    Hamısına bax
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {/* Add New Portfolio Button Card */}
                  <button 
                    onClick={() => setView('add-portfolio')}
                    className="aspect-square rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 flex items-center justify-center group transition-all duration-300 hover:border-blue-400 hover:shadow-md"
                  >
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Plus className="w-8 h-8 text-blue-500" />
                    </div>
                  </button>
                  {projects.map((project) => <button key={project.id} onClick={() => navigate(`/layiheler/${project.id}`)} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 group relative"><img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /><span className="absolute inset-x-2 bottom-2 bg-slate-950/75 text-white rounded-lg px-2 py-1 text-xs text-left truncate">{project.title}</span></button>)}
                </div>
              </div>

              {/* About Section */}
              <div className="glass-panel rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Haqqımda</h2>
                  <button onClick={() => navigate('/kabinet?tab=personal_info')} className="text-blue-600 bg-blue-50 font-bold hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors text-sm">
                    Redaktə et
                  </button>
                </div>
                
                <div className="space-y-4 text-lg">
                  <p className="text-slate-700">
                    <strong className="text-slate-900 font-black">İşin qiyməti:</strong> razılaşma yolu ilə başlayır
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900 font-black">Professional təcrübə:</strong> bir ildən azdır
                  </p>
                  <div className="pt-4 text-slate-600 font-medium">
                    {displayProfile.about || 'Bu freelancer hələ bio məlumatı əlavə etməyib.'}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN - SIDEBAR */}
            {}
            <div className="lg:col-span-4 space-y-8">
              
              <div className="glass-panel rounded-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden sticky top-28">
                
                {/* Statistics Block */}
                <div className="p-8">
                  <h3 className="font-black text-slate-900 mb-6">Statistika</h3>
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-slate-500 font-medium">Baxış sayı</span>
                    <span className="font-black text-slate-900 text-lg">{displayProfile.stats?.projectViews || 0}</span>
                  </div>

                  <h3 className="font-black text-slate-900 mb-6">Frilanserin statistikası</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Tamamlanmış sifarişlər</span>
                      <span className="font-black text-slate-900">{displayProfile.stats?.completedOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Davam edən sifarişlər</span>
                      <span className="font-black text-slate-900">{displayProfile.stats?.activeOrders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Müştərilərin rəyi</span>
                      <div className="font-black">
                        <span className="text-emerald-500">+0</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-red-500">-0</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">İzləyicilər</span>
                      <span className="font-bold text-slate-900">{displayProfile.followers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Təcrübə</span>
                      <span className="font-bold text-slate-900">{displayProfile.experience || 'Göstərilməyib'}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Block */}
                <div className="p-8 border-t border-slate-200/60">
                  <h3 className="font-black text-slate-900 mb-3">Frilanser ilə əlaqə</h3>
                  {Object.entries(displayProfile.socialLinks || {}).filter(([key, value]) => ['github', 'instagram', 'linkedin', 'facebook'].includes(key) && value).map(([key, value]) => <a key={key} href={value} target="_blank" rel="noreferrer" className="block text-blue-600 hover:underline text-sm font-semibold">{key}</a>)}
                  {!Object.entries(displayProfile.socialLinks || {}).some(([key, value]) => ['github', 'instagram', 'linkedin', 'facebook'].includes(key) && value) && <p className="text-slate-400 font-medium text-sm">Heç bir sosial link təyin edilməyib.</p>}
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* =========================================
             ADD PORTFOLIO VIEW
             ========================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            {/* LEFT COLUMN - FORM */}
            <div className="lg:col-span-8 space-y-8">
              
              <div className="glass-panel rounded-[2.5rem] p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-200/60 relative overflow-hidden">
                
                {/* Back Button & Title */}
                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-slate-200/80">
                  <button 
                    onClick={() => setView('profile')}
                    className="p-3 bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all shadow-sm"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-3xl font-black text-slate-900">Yeni Portfolio</h1>
                </div>

                <form onSubmit={handlePortfolioSubmit} className="space-y-10">
                  
                  {/* Project Name Input */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-3 text-lg">
                      Layihənin adı <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Mənim ilk qrafik işim" 
                      value={portfolio.title}
                      onChange={(event) => setPortfolio({ ...portfolio, title: event.target.value })}
                      className="w-full bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-6 py-4 text-lg font-medium outline-none transition-all"
                    />
                  </div>

                  {/* Project Description (Rich Text Mockup) */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-3 text-lg">
                      Layihənin təsviri <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                      
                      {/* Editor Toolbar */}
                      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1">
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><ImageIcon className="w-5 h-5" /></button>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 font-serif font-bold transition-colors">B</button>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 font-serif italic transition-colors">I</button>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 underline transition-colors">U</button>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 line-through transition-colors">S</button>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><AlignLeft className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><List className="w-5 h-5" /></button>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><Maximize className="w-5 h-5" /></button>
                      </div>
                      
                      <textarea
                        value={portfolio.description}
                        onChange={(event) => setPortfolio({ ...portfolio, description: event.target.value })}
                        placeholder="Layihə haqqda məlumat daxil edin.."
                        className="w-full min-h-[200px] p-6 resize-y outline-none text-lg font-medium text-slate-700 bg-transparent"
                      ></textarea>
                    </div>
                  </div>

                  {/* Redesigned Category Selection (Professional, No Neon) */}
                  {}
                  <div>
                    <label className="block text-slate-700 font-bold mb-4 text-lg">
                      Fəaliyyət sahəsi <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Clean Tabs */}
                    <div className="flex flex-wrap gap-3 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
                      {Object.values(CATEGORIES).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                            activeCategory === cat.id 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Clean Checkbox List */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 max-h-[300px] overflow-y-auto">
                      <div className="flex flex-col">
                        {CATEGORIES[activeCategory].items.map((item, idx) => (
                          <label key={idx} className="flex items-center gap-4 p-4 hover:bg-white rounded-xl cursor-pointer group transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="checkbox" 
                                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-500 checked:border-blue-500 transition-all cursor-pointer"
                              />
                              <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100" strokeWidth={4} />
                            </div>
                            <span className="text-slate-700 font-semibold group-hover:text-slate-900 transition-colors">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Area */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-2 text-lg">
                      Layihənin görüntüləri <span className="text-red-500">*</span>
                    </label>
                    <p className="text-slate-500 text-sm mb-4">
                      Layihənizi göstərmək üçün bir və ya daha çox şəkil yükləyin. Şəkillər tam ölçüdə nümayiş olunacaq. 4000x4000px-ə qədər png və jpg formatındakı şəkillər dəstəklənir.
                    </p>
                    
                    <label className="border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer group">
                      <input type="file" accept="image/*,video/*" onChange={handlePortfolioFile} className="sr-only" />
                      <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-700 font-bold shadow-sm">
                          Choose Files
                        </span>
                        <span className="text-slate-500 font-medium">{portfolio.imageUrl ? 'Fayl seçildi' : 'Fayl seçilməyib'}</span>
                      </div>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-slate-200/80 flex gap-4">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-sm shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                      Əlavə et
                    </button>
                    <button 
                      onClick={() => setView('profile')}
                      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-4 px-10 rounded-2xl shadow-sm transition-all"
                    >
                      Ləğv et
                    </button>
                  </div>
                  {portfolioMessage && <p className="text-sm font-semibold text-slate-600">{portfolioMessage}</p>}

                </form>
              </div>
            </div>

            {/* RIGHT COLUMN - INFO SIDEBAR */}
            {}
            <div className="lg:col-span-4 space-y-8">
              <div className="glass-panel rounded-3xl p-10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 sticky top-28">
                
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-white">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-6">«Frilans»-da Portfolio</h3>
                
                <div className="space-y-6 text-slate-600 font-medium leading-relaxed text-[15px]">
                  <p>
                    Frilans-dəki hər bir frilanser istifadəçi hər kəsə portfoliosunu göstərə bilər.
                  </p>
                  <p>
                    Portfolio, xidmətdə qəbul olunan başlıqlara bölünərək fərdi layihələrdən ibarətdir. Hər bir layihədə ən azı bir illüstrasiya olmalıdır və təsviri ola bilər.
                  </p>
                  <p>
                    Portfolio-dəki işlər hər zaman istifadəçinin profilində, eləcə də "Layihələr" bölməsində xidmət üzrə axtarış da mövcuddur.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// Helper component for the default avatar icon
function UserIconPlaceholder() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 opacity-30">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  );
}