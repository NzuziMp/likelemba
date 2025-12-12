import { PublicLayout } from '../components/Layout/PublicLayout';
import { Target, Heart, Award, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const About = () => {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              {t('about.title')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('about.subtitle')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-12 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t('about.whatIs')}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {t('about.whatIsDesc1')}
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {t('about.whatIsDesc2')}
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('about.whatIsDesc3')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('about.mission')}</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('about.missionDesc')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('about.objectives')}</h3>
              <ul className="text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                <li>• {t('about.objective1')}</li>
                <li>• {t('about.objective2')}</li>
                <li>• {t('about.objective3')}</li>
                <li>• {t('about.objective4')}</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-12 mb-12">
            <div className="flex items-center mb-6">
              <Heart className="w-8 h-8 text-primary-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('about.values')}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('about.communityFirst')}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {t('about.communityFirstDesc')}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('about.transparency')}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {t('about.transparencyDesc')}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('about.accessibility')}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {t('about.accessibilityDesc')}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('about.culturalRespect')}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {t('about.culturalRespectDesc')}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('about.security')}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {t('about.securityDesc')}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('about.empowerment')}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {t('about.empowermentDesc')}
                </p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ef5631' }} className="rounded-2xl p-8 md:p-12 text-white text-center">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('about.joinCommunity')}</h2>
            <p className="text-primary-50 mb-6 leading-relaxed">
              {t('about.joinCommunityDesc')}
            </p>
            <a
              href="/register"
              className="inline-block px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
            >
              {t('about.getStartedToday')}
            </a>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
