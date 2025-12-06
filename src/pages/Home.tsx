import { Link } from 'react-router-dom';
import { CircleDollarSign, Users, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { useLanguage } from '../contexts/LanguageContext';

export const Home = () => {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              <span className="inline-block animate-fade-in-up">
                {t('home.title')}
              </span>
              <span className="block text-primary-600 animate-fade-in-up-delayed bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 bg-clip-text text-transparent animate-gradient">
                {t('home.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed animate-fade-in">
              {t('home.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {t('home.getStarted')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center px-8 py-4 bg-white text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all border-2 border-slate-200"
              >
                {t('home.learnMore')}
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t('home.whyChoose')}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t('home.whySubtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-6">
                  <CircleDollarSign className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t('home.easyManagement')}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('home.easyManagementDesc')}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t('home.communityDriven')}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('home.communityDrivenDesc')}
                </p>
              </div>

              <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-violet-600 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t('home.secureReliable')}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('home.secureReliableDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <div style={{ backgroundColor: '#ef5631' }} className="rounded-3xl shadow-2xl p-12 text-center text-white">
            <TrendingUp className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.readyToStart')}
            </h2>
            <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
              {t('home.readySubtitle')}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-all shadow-lg"
            >
              {t('home.createAccount')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="bg-slate-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t('home.howItWorks')}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t('home.howItWorksSubtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t('home.step1')}</h3>
                <p className="text-slate-600 text-sm">{t('home.step1Desc')}</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t('home.step2')}</h3>
                <p className="text-slate-600 text-sm">{t('home.step2Desc')}</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t('home.step3')}</h3>
                <p className="text-slate-600 text-sm">{t('home.step3Desc')}</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  4
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t('home.step4')}</h3>
                <p className="text-slate-600 text-sm">{t('home.step4Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
