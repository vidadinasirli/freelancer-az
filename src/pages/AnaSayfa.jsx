import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Star, ArrowRight, Code, Users, Zap, ChevronRight,
  ShieldCheck, Globe, CheckCircle, Award, PenTool, Megaphone, Video
} from 'lucide-react';
import { AnimatedCounter, FadeInWhenVisible, TiltCard, FloatingOrb } from '../components/Effects.jsx';
import FreelancerCarousel from '../components/FreelancerCarousel.jsx';

export default function AnaSayfa() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans overflow-hidden">
      
      {/* Özel CSS Keyframes for Floating Orbs */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}} />

      {/* HERO SECTION - 3D ve Premium Hissiyat */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Arkaplan Dekorasyonları - Yüzen Küreler */}
        <FloatingOrb size="400px" color="bg-blue-400" top="-10%" left="10%" delay="0s" />
        <FloatingOrb size="500px" color="bg-cyan-300" top="20%" right="-10%" delay="2s" />
        <FloatingOrb size="300px" color="bg-indigo-300" bottom="-20%" left="40%" delay="4s" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Sol Taraf - Metin */}
          <div className="relative z-10">
            <FadeInWhenVisible delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-medium text-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Azərbaycanın Premium Freelance Platforması
              </div>
            </FadeInWhenVisible>
            
            <FadeInWhenVisible delay={0.2}>
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                İstedadlı <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400">Freelancerləri</span> Kəşf Edin.
              </h1>
            </FadeInWhenVisible>

            <FadeInWhenVisible delay={0.3}>
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                Layihələrinizi ən yaxşı mütəxəssislərlə həyata keçirin. Təhlükəsiz, sürətli və premium təcrübə ilə xəyallarınızı qurun.
              </p>
            </FadeInWhenVisible>

            <FadeInWhenVisible delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/frilanserler')}
                  className="px-8 py-4 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 group hover:-translate-y-1"
                >
                  Freelancer Tapın
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/tapsiriqlar')}
                  className="px-8 py-4 bg-white/60 backdrop-blur-md text-slate-900 border border-white/80 rounded-full font-medium hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/5 hover:-translate-y-1"
                >
                  İş İlanı Verin
                </button>
              </div>
            </FadeInWhenVisible>
          </div>

          {/* Sağ Taraf - Freelancer Carousel */}
          <div className="relative z-10 flex justify-center items-center">
            <FreelancerCarousel />
          </div>
        </div>
      </section>

      {/* MODERN EFFECTS SECTION */}
      <section className="py-16 px-6 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Sürətli', desc: '2 saat içində cavab', icon: '⚡' },
              { title: 'Təhlükəsiz', desc: 'Garanti olunan ödəmə', icon: '🔒' },
              { title: 'Professional', desc: '12,000+ istedadlı uzman', icon: '👨‍💼' }
            ].map((item, i) => (
              <div key={i} className="group relative bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl p-8 border border-white/60 hover:shadow-2xl hover:shadow-blue-500/20 transition-all hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-blue-500/10 group-hover:to-blue-500/5 rounded-3xl transition-all"></div>
                <div className="text-5xl mb-4 relative z-10">{item.icon}</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 relative z-10">{item.title}</h3>
                <p className="text-slate-600 font-medium relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İSTATİSTİKLER (Məlumatlandırıcı) */}
      <section className="py-20 px-6 relative z-10 -mt-10">
        <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl p-10 grid grid-cols-1 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200/50">
          {[
            { label: "Aktiv Freelancer", num: 12500, suffix: "+", icon: Users, color: "text-blue-500" },
            { label: "Tamamlanmış Layihə", num: 45000, suffix: "+", icon: Briefcase, color: "text-indigo-500" },
            { label: "Müştəri Məmnuniyyəti", num: 98, suffix: "%", icon: Star, color: "text-yellow-500" },
            { label: "Orta Cavab Müddəti", num: 2, suffix: " Saat", icon: Zap, color: "text-emerald-500" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center pt-6 md:pt-0 first:pt-0 px-4">
              <div className={`w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 shadow-sm border border-slate-100 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900 mb-2">
                <AnimatedCounter end={stat.num} suffix={stat.suffix} />
              </h3>
              <p className="text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KATEGORİLER - Glassmorphism Cards */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <FadeInWhenVisible>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Populyar Xidmətlər</h2>
                <p className="text-lg text-slate-600">Biznesinizi böyütmək üçün ehtiyacınız olan bütün peşəkarlıqlar tək platformada.</p>
              </FadeInWhenVisible>
            </div>
            <FadeInWhenVisible delay={0.2}>
              <button 
                onClick={() => navigate('/tapsiriqlar')}
                className="text-blue-600 font-bold hover:text-blue-800 flex items-center gap-2 bg-blue-50 px-6 py-3 rounded-full transition-colors"
              >
                Bütün kateqoriyalara bax <ArrowRight className="w-5 h-5" />
              </button>
            </FadeInWhenVisible>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Veb Proqramlaşdırma", desc: "Saytlar və tətbiqlər", icon: Code, color: "bg-blue-100 text-blue-600 border-blue-200" },
              { title: "Dizayn & Kreativ", desc: "Loqo, UI/UX, Brendinq", icon: PenTool, color: "bg-purple-100 text-purple-600 border-purple-200" },
              { title: "Rəqəmsal Marketinq", desc: "SEO, SMM, Reklam", icon: Megaphone, color: "bg-orange-100 text-orange-600 border-orange-200" },
              { title: "Video & Animasiya", desc: "Montaj, 2D/3D", icon: Video, color: "bg-emerald-100 text-emerald-600 border-emerald-200" }
            ].map((cat, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <div className="group p-8 rounded-3xl bg-white/60 backdrop-blur-lg border border-white shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-3 transition-all duration-500 cursor-pointer h-full flex flex-col relative overflow-hidden">
                  {/* Kart içi hover parlama efekti */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  <div className={`w-14 h-14 rounded-2xl ${cat.color} border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative z-10`}>
                    <cat.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">{cat.title}</h3>
                  <p className="text-slate-500 mb-6 relative z-10">{cat.desc}</p>
                  <div className="mt-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors relative z-10">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR - Adım Adım Akış */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-blue-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <FadeInWhenVisible>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Necə İşləyir?</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Sifariş vermək və ya işə başlamaq sadəcə 3 addımdır.</p>
            </FadeInWhenVisible>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Bağlantı çizgisi (Sadece masaüstü) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 -z-10"></div>

            {[
              { step: "01", title: "Profilini Yarat", desc: "Bacarıqlarını əlavə et və ya ehtiyacın olan mütəxəssisi axtar.", icon: Users },
              { step: "02", title: "Sifariş Ver / Qəbul Et", desc: "Detalları razılaşdır, təhlükəsiz ödəniş sistemimizə depozit qoy.", icon: CheckCircle },
              { step: "03", title: "Nəticəni Təhvil Al", desc: "İş uğurla bitdikdən sonra ödəniş sərbəst buraxılsın.", icon: Award }
            ].map((item, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.2}>
                <div className="relative flex flex-col items-center text-center group">
                  <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-blue-900/5 flex items-center justify-center mb-8 border border-slate-100 group-hover:border-blue-300 group-hover:-translate-y-2 transition-all duration-300 relative z-10">
                    <span className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                      {item.step}
                    </span>
                    <item.icon className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 font-medium">{item.desc}</p>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US - Premium Info Section */}
      <section className="py-32 px-6 bg-slate-950 text-white relative overflow-hidden rounded-[3rem] mx-4 md:mx-10 mb-20 shadow-2xl">
        {/* Lüks karanlık arkaplan efektleri */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-900/50 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <FadeInWhenVisible>
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">Niyə <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Freelancer.az</span>?</h2>
              <p className="text-slate-400 text-lg mb-12 max-w-lg leading-relaxed">Biz sadəcə bir platforma deyilik, Azərbaycanın rəqəmsal iş dünyasının gələcəyiyik. Təhlükəsizlik və keyfiyyət bizim prioritetimizdir.</p>
            </FadeInWhenVisible>

            <div className="space-y-8">
              {[
                { title: "Zəmanətli Ödənişlər", desc: "İş təsdiqlənmədən ödəniş freelancerə köçürülmür.", icon: ShieldCheck },
                { title: "Seçilmiş Peşəkarlar", desc: "Hər bir freelancer portfelinə görə xüsusi yoxlanışdan keçir.", icon: Star },
                { title: "Sürətli Təslim", desc: "Layihələrinizi vaxtında və keyfiyyətli şəkildə əldə edin.", icon: Zap }
              ].map((item, i) => (
                <FadeInWhenVisible key={i} delay={0.2 + (i * 0.1)}>
                  <div className="flex gap-6 group cursor-default">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-800/80 text-blue-400 flex items-center justify-center border border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">{item.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>
          
          <div className="relative">
             <FadeInWhenVisible delay={0.4}>
                <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-700/50 shadow-2xl bg-slate-900 p-2">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 pointer-events-none"></div>
                  {/* Temsili görsel - 3D Derinlik Hissi Veren UI Mockup */}
                  <div className="w-full h-[500px] bg-slate-950 rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                    {/* Arka plan animasyonlu gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-950 opacity-50 group-hover:scale-110 transition-transform duration-1000"></div>
                    
                    {/* UI Element 1 */}
                    <div className="absolute top-10 left-10 w-48 h-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl transform rotate-[-5deg] group-hover:rotate-0 group-hover:-translate-y-2 transition-all duration-500"></div>
                    {/* UI Element 2 */}
                    <div className="absolute top-32 right-10 w-64 h-24 bg-blue-600/10 backdrop-blur-md rounded-xl border border-blue-400/20 shadow-2xl transform rotate-[3deg] group-hover:rotate-0 group-hover:translate-x-2 transition-all duration-500 delay-100"></div>
                    {/* Main UI Element */}
                    <div className="relative z-10 w-64 h-64 bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600 p-6 flex flex-col justify-center items-center shadow-[0_0_50px_rgba(37,_99,_235,_0.2)] group-hover:scale-105 transition-all duration-500 delay-200">
                       <Globe className="w-16 h-16 text-blue-400 mb-4 animate-pulse" />
                       <div className="text-slate-300 font-medium text-center">Qlobal Standartlarda <br/> Yerli Platforma</div>
                    </div>
                  </div>
                  
                  {/* Floating Elements on Image */}
                  <div className="absolute bottom-8 left-8 z-20 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl max-w-xs animate-bounce" style={{animationDuration: '3s'}}>
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                         <ShieldCheck className="w-6 h-6" />
                       </div>
                       <div>
                         <p className="text-xs text-slate-300 uppercase tracking-wider mb-1">Status</p>
                         <p className="font-bold text-white">100% Güvənli Ödəniş</p>
                       </div>
                     </div>
                  </div>
                </div>
             </FadeInWhenVisible>
          </div>
        </div>
      </section>

      {/* CTA Section - Parallax Effect */}
      <section className="py-24 px-6 text-center relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-white -z-20"></div>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[20rem] rounded-full bg-blue-100/70 blur-3xl -z-10"></div>
        
        <FadeInWhenVisible>
          <div className="bg-slate-950 rounded-[3rem] max-w-5xl mx-auto p-10 md:p-16 shadow-2xl shadow-blue-900/20">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">İndi başlamaq vaxtıdır</h2>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">Bacarıqlarınızı göstərin və ya biznesiniz üçün doğru mütəxəssisi bir neçə dəqiqəyə tapın.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/giris?mode=register')}
                className="px-10 py-5 bg-white text-blue-600 rounded-full font-bold hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-1 hover:shadow-white/20 text-lg"
              >
                Qeydiyyatdan Keç
              </button>
            </div>
          </div>
        </FadeInWhenVisible>
      </section>

    </div>
  );
}
