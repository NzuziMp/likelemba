import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const ForgotPassword = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('forgotPassword.title')}</h1>
              <p className="text-slate-600">{t('forgotPassword.subtitle')}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success ? (
              <div className="space-y-6">
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-primary-800 text-sm">
                    {t('forgotPassword.successMessage')}
                  </p>
                </div>
                <Link
                  to="/login"
                  className="flex items-center justify-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('forgotPassword.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('forgotPassword.sending') : t('forgotPassword.sendLink')}
                </button>

                <Link
                  to="/login"
                  className="flex items-center justify-center text-slate-600 hover:text-slate-900 font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('forgotPassword.backToLogin')}
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
