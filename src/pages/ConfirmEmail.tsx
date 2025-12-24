import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

export const ConfirmEmail = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        const token = hashParams.get('access_token');

        if (type === 'signup' && token) {
          const { error } = await supabase.auth.getSession();

          if (error) {
            setErrorMessage(error.message);
            setStatus('error');
          } else {
            setStatus('success');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        } else {
          setErrorMessage('Invalid or expired confirmation link');
          setStatus('error');
        }
      } catch (error) {
        setErrorMessage('An error occurred during email confirmation');
        setStatus('error');
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <div className="text-center">
              {status === 'loading' && (
                <>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('confirmEmail.verifying') || 'Verifying your email...'}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300">
                    {t('confirmEmail.pleaseWait') || 'Please wait while we confirm your email address'}
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('confirmEmail.success') || 'Email Confirmed!'}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {t('confirmEmail.successMessage') || 'Your email has been successfully confirmed. You can now log in to your account.'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('confirmEmail.redirecting') || 'Redirecting to login page...'}
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('confirmEmail.error') || 'Confirmation Failed'}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {errorMessage || (t('confirmEmail.errorMessage') || 'There was an error confirming your email address.')}
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all"
                  >
                    {t('confirmEmail.goToLogin') || 'Go to Login'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
