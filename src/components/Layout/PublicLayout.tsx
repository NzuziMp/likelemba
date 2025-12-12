import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Info, Mail, LogIn, UserPlus, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';
import { ScrollToTop } from '../ScrollToTop';
import { SocialMediaLinks } from '../SocialMediaLinks';

interface PublicLayoutProps {
  children: ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-slate-200 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/fichier_7.png" alt="Likelemba" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-slate-900">Likelemba</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t('nav.home')}</span>
              </Link>
              <Link
                to="/about"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/about')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>{t('nav.about')}</span>
              </Link>
              <Link
                to="/faq"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/faq')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>{t('nav.faq')}</span>
              </Link>
              <Link
                to="/contact"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/contact')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>{t('nav.contact')}</span>
              </Link>
              <Link
                to="/login"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/login')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{t('nav.login')}</span>
              </Link>
              <Link
                to="/register"
                className="ml-2 flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('nav.register')}</span>
              </Link>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">{children}</main>

      <footer className="mt-20" style={{ backgroundColor: '#464444' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-3">Follow us on social media</p>
              <SocialMediaLinks />
            </div>
            <div className="pt-4 border-t border-slate-600">
              <p className="mb-2 text-slate-300">&copy; {new Date().getFullYear()} Likelemba. {t('footer.copyright')}</p>
              <p className="text-sm text-slate-400">{t('footer.tagline')}</p>
            </div>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
};
