import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Info, Mail, LogIn, UserPlus, HelpCircle, Menu, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';
import { ThemeToggle } from '../ThemeToggle';
import { ScrollToTop } from '../ScrollToTop';
import { SocialMediaLinks } from '../SocialMediaLinks';

interface PublicLayoutProps {
  children: ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  const location = useLocation();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">L</div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Likelemba</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t('nav.home')}</span>
              </Link>
              <Link
                to="/about"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/about')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>{t('nav.about')}</span>
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
              <Link
                to="/contact"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/contact')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>{t('nav.contact')}</span>
              </Link>
              <Link
                to="/login"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/login')
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{t('nav.login')}</span>
              </Link>
              <Link
                to="/register"
                className="ml-2 flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('nav.register')}</span>
              </Link>
              <ThemeToggle />
              <LanguageSelector />
            </div>

            <div className="flex md:hidden items-center space-x-2">
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
            <div className="md:hidden border-t border-slate-200 dark:border-slate-700 py-4">
              <div className="flex flex-col space-y-2">
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>{t('nav.home')}</span>
                </Link>
                <Link
                  to="/about"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/about')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Info className="w-5 h-5" />
                  <span>{t('nav.about')}</span>
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
                <Link
                  to="/contact"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/contact')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                  <span>{t('nav.contact')}</span>
                </Link>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/login')
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
                  }`}
                >
                  <LogIn className="w-5 h-5" />
                  <span>{t('nav.login')}</span>
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-2 px-4 py-3 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{t('nav.register')}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="pt-16">{children}</main>

      <footer className="mt-20 bg-slate-700 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-200 dark:text-slate-300 mb-3">Follow us on social media</p>
              <SocialMediaLinks />
            </div>
            <div className="pt-4 border-t border-slate-600 dark:border-slate-700">
              <p className="mb-2 text-slate-300 dark:text-slate-400">&copy; {new Date().getFullYear()} Likelemba. {t('footer.copyright')}</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">{t('footer.tagline')}</p>
            </div>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
};
