import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ThemeToggle } from '../ThemeToggle';
import { ScrollToTop } from '../ScrollToTop';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { adminUser, isSuperAdmin } = useAdmin();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <ScrollToTop />

      <nav className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/fichier_7 copy copy.png" alt="Likelemba" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold">Likelemba Admin</h1>
                <p className="text-xs text-slate-300 dark:text-slate-400">
                  {adminUser?.role === 'super_admin' ? 'Super Admin' :
                   adminUser?.role === 'admin' ? 'Administrator' : 'Moderator'}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="flex md:hidden items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isMobileMenuOpen && (
          <div className="md:hidden mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <nav className="space-y-2">
              <Link
                to="/admin/dashboard"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>{t('admin.nav.dashboard')}</span>
              </Link>

              <Link
                to="/admin/users"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive('/admin/users')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>{t('admin.nav.users')}</span>
              </Link>

              <Link
                to="/admin/groups"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive('/admin/groups')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>{t('admin.nav.groups')}</span>
              </Link>

              <Link
                to="/admin/messages"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive('/admin/messages')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>{t('admin.nav.messages')}</span>
              </Link>

              <Link
                to="/admin/activity"
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive('/admin/activity')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <Activity className="w-5 h-5" />
                <span>{t('admin.nav.activity')}</span>
              </Link>

              {isSuperAdmin && (
                <Link
                  to="/admin/settings"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/admin/settings')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>{t('admin.nav.settings')}</span>
                </Link>
              )}

              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>{t('admin.nav.userView')}</span>
                </Link>

                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleSignOut();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="hidden md:block md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sticky top-8">
              <nav className="space-y-2">
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/admin/dashboard')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>{t('admin.nav.dashboard')}</span>
                </Link>

                <Link
                  to="/admin/users"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/admin/users')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>{t('admin.nav.users')}</span>
                </Link>

                <Link
                  to="/admin/groups"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/admin/groups')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span>{t('admin.nav.groups')}</span>
                </Link>

                <Link
                  to="/admin/messages"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/admin/messages')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>{t('admin.nav.messages')}</span>
                </Link>

                <Link
                  to="/admin/activity"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/admin/activity')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  <span>{t('admin.nav.activity')}</span>
                </Link>

                {isSuperAdmin && (
                  <Link
                    to="/admin/settings"
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive('/admin/settings')
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span>{t('admin.nav.settings')}</span>
                  </Link>
                )}

                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>{t('admin.nav.userView')}</span>
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
