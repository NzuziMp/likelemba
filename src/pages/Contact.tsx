import { useState } from 'react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

export const Contact = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name,
          email,
          phone: phone || null,
          message,
        });

      if (error) throw error;

      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-slate-600">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{t('contact.email')}</h3>
              <p className="text-slate-600">contact@likelemba.com</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{t('contact.phone')}</h3>
              <p className="text-slate-600">+1 (418) 732-1925</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{t('contact.address')}</h3>
              <p className="text-slate-600">Rimouski, QC, Canada</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('contact.sendMessage')}</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-primary-800 text-sm">
                  {t('contact.successMessage')}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('contact.fullName')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Nzuzi Mpingi"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('contact.emailAddress')}
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
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('contact.phoneNumber')} <span className="text-slate-400 font-normal">({t('contact.optional')})</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="+1 (418) 732-1925"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('contact.message')}
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                  placeholder={t('contact.messagePlaceholder')}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {loading ? t('contact.sending') : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {t('contact.sendButton')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
