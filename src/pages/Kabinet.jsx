import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const VALID_TABS = ['dashboard', 'personal_info', 'freelancer_info', 'change_password'];
const DASHBOARD_SUBTABS = [
  { id: 'cavablarim', label: 'Cavablarım' },
  { id: 'is_gedir', label: 'İş gedir' },
  { id: 'tamamlanmis', label: 'Tamamlanmış' },
  { id: 'arbitraj', label: 'Arbitraj' },
];

export default function Kabinet() {
  const { user, profileData, saveProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSubTab, setActiveSubTab] = useState('cavablarim');
  const [localProfile, setLocalProfile] = useState(profileData);
  const [saveMessage, setSaveMessage] = useState('');
  const [socialLinks, setSocialLinks] = useState({ github: '', instagram: '', linkedin: '', facebook: '', displayLink1: '', displayLink2: '' });
  const [specialties, setSpecialties] = useState([]);
  const [dashboardData, setDashboardData] = useState({ replies: [], active: [], completed: [], arbitration: [] });
  const [specialtyForm, setSpecialtyForm] = useState({ category: '', title: '', about: '', hourlyRate: '', experience: '1-3 il' });
  const [specialtyError, setSpecialtyError] = useState('');
  const [mediaUploading, setMediaUploading] = useState('');

  useEffect(() => {
    if (!user) navigate('/giris');
  }, [user, navigate]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (VALID_TABS.includes(t)) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    setLocalProfile(profileData);
  }, [profileData]);

  useEffect(() => { if (user) api.getSocialLinks().then(setSocialLinks).catch(() => {}); }, [user]);
  useEffect(() => { if (user?.role === 'freelancer') api.getSpecialties().then(setSpecialties).catch(() => {}); }, [user]);
  useEffect(() => { if (user) api.getDashboardTasks().then(setDashboardData).catch(() => {}); }, [user]);

  const goTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [saveError, setSaveError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveMessage('');
    try {
      const { id, email, role, createdAt, ...editableProfile } = localProfile;
      await saveProfile(editableProfile);
      setSaveMessage('Məlumatlar uğurla yadda saxlanıldı.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveError(err.message || 'Xəta baş verdi.');
    }
  };

  const saveSocial = async () => {
    await api.saveSocialLinks(socialLinks);
    setSaveMessage('Sosial linklər yadda saxlanıldı.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const addSpecialty = async () => {
    setSpecialtyError('');
    try {
      const item = await api.addSpecialty({
        ...specialtyForm,
        hourlyRate: Number(specialtyForm.hourlyRate) || 0,
      });
      setSpecialties((current) => [item, ...current]);
      setSpecialtyForm({ category: '', title: '', about: '', hourlyRate: '', experience: '1-3 il' });
    } catch (err) {
      setSpecialtyError(err.message || 'İxtisas sahəsi əlavə edilə bilmədi.');
    }
  };

  const uploadProfileMedia = async (field, file) => {
    if (!file) return;
    setMediaUploading(field);
    setSaveError('');
    setSaveMessage('');
    try {
      const uploaded = await api.uploadMedia(file);
      setLocalProfile((current) => ({ ...current, [field]: uploaded.url }));
      setSaveError('');
      setSaveMessage(field === 'avatarUrl'
        ? 'Profil şəkli seçildi. Yadda saxlamaq üçün “Yadda saxla” düyməsinə basın.'
        : 'Banner şəkli seçildi. Yadda saxlamaq üçün “Yadda saxla” düyməsinə basın.');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setMediaUploading('');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6] pt-28 pb-20 px-4 md:px-8 font-sans">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-tab { animation: fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 tracking-tight">Kabinet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SIDEBAR */}
          <aside className="lg:col-span-4 space-y-4 sticky top-28 self-start">
            <SidebarGroup title="Kabinet">
              {DASHBOARD_SUBTABS.map((sub) => (
                <SidebarButton
                  key={sub.id}
                  active={activeTab === 'dashboard' && activeSubTab === sub.id}
                  onClick={() => { goTab('dashboard'); setActiveSubTab(sub.id); }}
                >
                  {sub.label} ({dashboardData[sub.id === 'cavablarim' ? 'replies' : sub.id === 'is_gedir' ? 'active' : sub.id === 'tamamlanmis' ? 'completed' : 'arbitration'].length})
                </SidebarButton>
              ))}
            </SidebarGroup>

            <SidebarGroup title="Profil">
              <SidebarButton active={activeTab === 'personal_info'} onClick={() => goTab('personal_info')}>
                Şəxsi məlumat
              </SidebarButton>
              {user.role === 'freelancer' && (
                <SidebarButton active={activeTab === 'freelancer_info'} onClick={() => goTab('freelancer_info')}>
                  Frilanser məlumatları
                </SidebarButton>
              )}
            </SidebarGroup>

            <SidebarGroup title="Ayarlar">
              <SidebarButton active={activeTab === 'change_password'} onClick={() => goTab('change_password')}>
                Şifrəni dəyiş
              </SidebarButton>
            </SidebarGroup>
          </aside>

          {/* MAIN */}
          <main className="lg:col-span-8">
            {activeTab === 'dashboard' && (
              <div key="dashboard" className="fade-tab bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800">
                    {DASHBOARD_SUBTABS.find((s) => s.id === activeSubTab)?.label}
                  </h2>
                </div>
                <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
                  {DASHBOARD_SUBTABS.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubTab(sub.id)}
                      className={`whitespace-nowrap px-8 py-4 font-bold text-sm transition-colors relative ${
                        activeSubTab === sub.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {sub.label} ({dashboardData[sub.id === 'cavablarim' ? 'replies' : sub.id === 'is_gedir' ? 'active' : sub.id === 'tamamlanmis' ? 'completed' : 'arbitration'].length})
                      {activeSubTab === sub.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
                    </button>
                  ))}
                </div>
                <div className="p-6 min-h-[360px]">
                  {(() => {
                    const key = activeSubTab === 'cavablarim' ? 'replies' : activeSubTab === 'is_gedir' ? 'active' : activeSubTab === 'tamamlanmis' ? 'completed' : 'arbitration';
                    const items = dashboardData[key];
                    return items.length ? <div className="space-y-3">{items.map((item) => <div key={`${item.taskId || item.id}-${item.id}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50"><p className="font-bold text-slate-800">{item.taskTitle || item.title}</p><p className="text-sm text-slate-500 mt-1">Status: {item.taskStatus || item.status}</p></div>)}</div> : <div className="p-16 flex flex-col items-center justify-center text-center"><Search className="w-16 h-16 text-slate-300 mb-4" /><h3 className="text-2xl font-bold text-slate-400">Hələ heç nə yoxdur</h3></div>;
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'personal_info' && (
              <div key="personal_info" className="fade-tab space-y-6">
                <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Field label="Ad" required>
                      <input
                        type="text"
                        value={localProfile.fullName}
                        onChange={(e) => setLocalProfile({ ...localProfile, fullName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        placeholder="Adınız"
                      />
                    </Field>
                    <Field label="E-poçt">
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500"
                      />
                    </Field>
                    <Field label="Nickname">
                      <input value={localProfile.nickname || ''} onChange={(e) => setLocalProfile({ ...localProfile, nickname: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="nickname" />
                    </Field>
                    <Field label="Telefon">
                      <input value={localProfile.phone || ''} onChange={(e) => setLocalProfile({ ...localProfile, phone: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="+994..." />
                    </Field>
                    <Field label="Profil şəkli URL">
                      <input value={localProfile.avatarUrl || ''} onChange={(e) => setLocalProfile({ ...localProfile, avatarUrl: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="https://..." />
                      <input type="file" accept="image/*" onChange={(e) => uploadProfileMedia('avatarUrl', e.target.files?.[0])} className="mt-2 w-full text-sm" disabled={mediaUploading === 'avatarUrl'} />
                    </Field>
                    <Field label="Banner şəkli URL">
                      <input value={localProfile.bannerUrl || ''} onChange={(e) => setLocalProfile({ ...localProfile, bannerUrl: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="https://..." />
                      <input type="file" accept="image/*" onChange={(e) => uploadProfileMedia('bannerUrl', e.target.files?.[0])} className="mt-2 w-full text-sm" disabled={mediaUploading === 'bannerUrl'} />
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-slate-700 text-sm">Haqqımda</h3>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h3 className="font-bold text-slate-700 mb-4">Sosial linklər</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['github', 'instagram', 'linkedin', 'facebook'].map((key) => <input key={key} value={socialLinks[key]} onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })} placeholder={`${key} linki`} className="px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />)}
                      </div>
                      <button type="button" onClick={saveSocial} className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold">Linkləri yadda saxla</button>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                      <textarea
                        className="w-full min-h-[180px] p-4 outline-none resize-y text-slate-700 bg-transparent"
                        placeholder="Özünüz haqqında məlumat daxil edin.."
                        value={localProfile.about}
                        onChange={(e) => setLocalProfile({ ...localProfile, about: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-3">
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
                      Yadda saxla
                    </button>
                    <button type="button" onClick={() => setLocalProfile(profileData)} className="px-6 py-2.5 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
                      Rədd et
                    </button>
                  </div>

                  {saveMessage && (
                    <div className="mt-4 p-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> {saveMessage}
                    </div>
                  )}
                  {saveError && (
                    <div className="mt-4 p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700">
                      {saveError}
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'freelancer_info' && (
              <div key="freelancer_info" className="fade-tab bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-8">Frilanser məlumatları</h2>

                <div className="space-y-8">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={localProfile.isProfileVisible}
                      onChange={(e) => setLocalProfile({ ...localProfile, isProfileVisible: e.target.checked })}
                      className="mt-1 w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        Freelancer-lər siyahısında mənim anketim görünsün
                      </p>
                    </div>
                  </label>

                  <Field label="Status" required>
                    <input
                      type="text"
                      value={localProfile.status}
                      onChange={(e) => setLocalProfile({ ...localProfile, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
                      placeholder="Məsələn: Interior Designer"
                    />
                  </Field>

                  <Field label="İş təcrübəsi" required>
                    <select
                      value={localProfile.experience}
                      onChange={(e) => setLocalProfile({ ...localProfile, experience: e.target.value })}
                      className="w-full md:w-64 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700 font-medium"
                    >
                      <option value="bir ilden azdir">bir ildən azdır</option>
                      <option value="1-3 il">1-3 il</option>
                      <option value="3-5 il">3-5 il</option>
                      <option value="5+ il">5+ ildən çox</option>
                    </select>
                  </Field>

                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-3">Məxfilik seçimləri</h3>
                    <label className="flex items-center gap-3 text-sm text-slate-600"><input type="checkbox" checked={localProfile.privacySettings?.acceptMessages !== false} onChange={(e) => setLocalProfile({ ...localProfile, privacySettings: { ...localProfile.privacySettings, acceptMessages: e.target.checked } })} /> Hamıdan mesaj qəbul et</label>
                    <label className="flex items-center gap-3 text-sm text-slate-600 mt-3"><input type="checkbox" checked={localProfile.privacySettings?.showPortfolio !== false} onChange={(e) => setLocalProfile({ ...localProfile, privacySettings: { ...localProfile.privacySettings, showPortfolio: e.target.checked } })} /> Portfolio layihələrimdə görünsün</label>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-3">İxtisas sahələri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={specialtyForm.category} onChange={(e) => setSpecialtyForm({ ...specialtyForm, category: e.target.value })} placeholder="Kateqoriya" className="px-3 py-2 border border-slate-200 rounded-lg" />
                      <input value={specialtyForm.title} onChange={(e) => setSpecialtyForm({ ...specialtyForm, title: e.target.value })} placeholder="İş başlığı" className="px-3 py-2 border border-slate-200 rounded-lg" />
                      <input value={specialtyForm.hourlyRate} onChange={(e) => setSpecialtyForm({ ...specialtyForm, hourlyRate: e.target.value })} type="number" placeholder="Saatlıq qiymət" className="px-3 py-2 border border-slate-200 rounded-lg" />
                      <select value={specialtyForm.experience} onChange={(e) => setSpecialtyForm({ ...specialtyForm, experience: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg bg-white"><option>bir ildən az</option><option>1-3 il</option><option>3-5 il</option><option>5+ il</option></select>
                    </div>
                    <textarea value={specialtyForm.about} onChange={(e) => setSpecialtyForm({ ...specialtyForm, about: e.target.value })} placeholder="Bu sahə haqqında qısa açıqlama" className="w-full mt-3 px-3 py-2 border border-slate-200 rounded-lg min-h-20" />
                    {specialtyError && <p className="mt-3 text-sm text-red-600">{specialtyError}</p>}
                    <button type="button" onClick={addSpecialty} className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold">Sahə əlavə et</button>
                    <div className="mt-4 space-y-2">{specialties.map((item) => <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div><b>{item.title}</b><p className="text-xs text-slate-500">{item.category} · {item.hourlyRate} AZN</p></div><button type="button" onClick={async () => { await api.deleteSpecialty(item.id); setSpecialties(specialties.filter((entry) => entry.id !== item.id)); }} className="text-red-500 text-xs font-bold">Sil</button></div>)}</div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex gap-3">
                    <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
                      Yadda saxla
                    </button>
                    <button onClick={() => setLocalProfile(profileData)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                      Rədd et
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'change_password' && (
              <div key="change_password" className="fade-tab space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold">
                  <Lock className="w-5 h-5 shrink-0" />
                  Şifrə yeniləndikdən sonra hesabdan avtomatik olaraq çıxış olunacaq
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Field label="Mövcud şifrə" required>
                      <input type="password" placeholder="******" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                    </Field>
                    <Field label="Yeni şifrə" required>
                      <input type="password" placeholder="******" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                    </Field>
                    <Field label="Təkrar yeni şifrə" required>
                      <input type="password" placeholder="******" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                    </Field>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
                      Şifrəni yenilə
                    </button>
                    <button className="px-6 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                      Rədd et
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarGroup({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100 text-sm font-medium">{children}</div>
    </div>
  );
}

function SidebarButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4 ${
        active ? 'border-blue-500 bg-blue-50/30 text-blue-700 font-bold' : 'border-transparent text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
