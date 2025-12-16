import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, DollarSign, LogOut, User as UserIcon, Settings, ChevronDown, CheckSquare, HelpCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';
import { ThemeToggle } from '../ThemeToggle';
import { ScrollToTop } from '../ScrollToTop';
import { SocialMediaLinks } from '../SocialMediaLinks';

interface UserLayoutProps {
  children: ReactNode;
}

export const UserLayout = ({ children }: UserLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { t } = useLanguage();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <img src="/Logo-1.jpg" alt="Likelemba" className="w-10 h-10 object-contain rounded" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">Likelemba</span>
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t('nav.dashboard')}</span>
              </Link>
              <Link
                to="/likelemba"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/likelemba')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>{t('nav.likelemba')}</span>
              </Link>
              <Link
                to="/members"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/members')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t('nav.members')}</span>
              </Link>
              <Link
                to="/payment-tracking"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/payment-tracking')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Payments</span>
              </Link>
              <Link
                to="/payout-history"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/payout-history')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>{t('nav.payoutHistory')}</span>
              </Link>
              <Link
                to="/faq"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/faq')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>{t('nav.faq')}</span>
              </Link>

              <ThemeToggle />
              <LanguageSelector />

              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{profile?.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{profile?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-2 px-4 py-3 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Mon Profil</span>
                    </Link>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex lg:hidden items-center space-x-2">
              <ThemeToggle />
              <LanguageSelector />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 dark:border-slate-700 py-4">
              <div className="flex flex-col space-y-2">
                {profile && (
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-600 flex items-center justify-center overflow-hidden">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{profile.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{profile.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>{t('nav.dashboard')}</span>
                </Link>
                <Link
                  to="/likelemba"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/likelemba')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>{t('nav.likelemba')}</span>
                </Link>
                <Link
                  to="/members"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/members')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>{t('nav.members')}</span>
                </Link>
                <Link
                  to="/payment-tracking"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/payment-tracking')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <CheckSquare className="w-5 h-5" />
                  <span>Payments</span>
                </Link>
                <Link
                  to="/payout-history"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/payout-history')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>{t('nav.payoutHistory')}</span>
                </Link>
                <Link
                  to="/faq"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/faq')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>{t('nav.faq')}</span>
                </Link>

                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Mon Profil</span>
                  </Link>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="pt-16 pb-24">
        <div className="container mx-auto px-4 py-8">
          {profile && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.welcome')}, {profile.full_name}</h1>
            </div>
          )}
          <main>{children}</main>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 py-4 bg-slate-700 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-xs text-slate-300 dark:text-slate-400">Follow us on social media</p>
            <SocialMediaLinks />
            <p className="text-xs text-slate-400 dark:text-slate-500">&copy; {new Date().getFullYear()} Likelemba. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
};
