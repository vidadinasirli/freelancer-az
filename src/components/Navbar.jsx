import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, LayoutGrid, LifeBuoy, UserCircle, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINKS = [
  { to: '/frilanserler', label: 'Freelancerlər' },
  { to: '/tapsiriqlar', label: 'Tapşırıqlar' },
  { to: '/layiheler', label: 'Layihələr' },
  { to: '/klub', label: 'Klub' },
];

const ACCOUNT_MENU_ITEMS = [
  { to: '/kabinet?tab=dashboard', label: 'Kabinet', icon: LayoutGrid },
  { to: '/destek', label: 'Dəstək', icon: LifeBuoy },
  { to: '/profil', label: 'Profil', icon: UserCircle },
  { to: '/kabinet?tab=personal_info', label: 'Redaktə et', icon: Pencil },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const closeTimer = useRef(null);
  const { user, profileData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const openAccountMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setAccountMenuOpen(true);
  };
  const scheduleCloseAccountMenu = () => {
    closeTimer.current = setTimeout(() => setAccountMenuOpen(false), 150);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled || !isHome
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-sky-400 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 group-hover:rotate-12 transition-transform">
            F
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Freelancer<span className="text-blue-600">.az</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-semibold text-slate-600">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `hover:text-blue-600 transition-colors ${isActive ? 'text-blue-600' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/mesajlar" className="hover:text-blue-600 font-semibold text-slate-600 transition-colors">
                Mesajlar
              </Link>
              <Link to="/bildirimler" className="hover:text-blue-600 font-semibold text-slate-600 transition-colors" title="Bildirişlər">Bildirişlər</Link>

              {/* Account dropdown — "curtain" reveal on hover */}
              <div
                className="relative"
                onMouseEnter={openAccountMenu}
                onMouseLeave={scheduleCloseAccountMenu}
              >
                <button
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  className="flex items-center gap-2 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="font-bold text-sm text-slate-700">Kabinetim</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Invisible bridge so the curtain doesn't close on the gap between trigger & panel */}
                <div className="absolute left-0 top-full w-full h-3" />

                <div
                  className={`account-curtain absolute right-0 top-full mt-3 w-64 origin-top ${
                    accountMenuOpen ? 'account-curtain-open' : 'account-curtain-closed'
                  }`}
                >
                  <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{profileData.fullName || 'İstifadəçi'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-2">
                      {ACCOUNT_MENU_ITEMS.map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          className="flex items-center gap-3 px-5 py-3 text-slate-600 font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <item.icon className="w-[18px] h-[18px]" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="py-2 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-3 text-red-500 font-semibold hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-[18px] h-[18px]" />
                        Çıxış et
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link to="/giris" className="text-slate-600 hover:text-slate-900 font-bold px-4 py-2 transition-colors">
                Daxil ol
              </Link>
              <Link
                to="/giris?mode=register"
                className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
              >
                Qeydiyyat
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-slate-900 bg-white/50 p-2 rounded-lg backdrop-blur-md border border-slate-200"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-2xl py-6 px-6 flex flex-col gap-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-left py-2 text-lg font-bold text-slate-800 hover:text-blue-600">
              {link.label}
            </Link>
          ))}
          <div className="h-px bg-slate-100 my-2" />
          {user ? (
            <>
              <Link to="/mesajlar" className="text-left py-2 text-lg font-bold text-slate-800">Mesajlar</Link>
              <Link to="/bildirimler" className="text-left py-2 text-lg font-bold text-slate-800">Bildirişlər</Link>
              {ACCOUNT_MENU_ITEMS.map((item) => (
                <Link key={item.label} to={item.to} className="flex items-center gap-3 text-left py-2 text-lg font-bold text-slate-800">
                  <item.icon className="w-5 h-5 text-slate-400" />
                  {item.label}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-3 text-left py-2 text-lg font-bold text-red-500">
                <LogOut className="w-5 h-5" />
                Çıxış et
              </button>
            </>
          ) : (
            <>
              <Link to="/giris" className="text-left py-2 text-lg font-bold text-slate-800">Daxil ol</Link>
              <Link to="/giris?mode=register" className="bg-blue-600 text-white text-center py-4 rounded-xl font-bold mt-2 shadow-lg shadow-blue-600/30">
                Qeydiyyatdan Keç
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
