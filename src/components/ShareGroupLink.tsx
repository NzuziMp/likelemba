import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Share2, Copy, CheckCircle2, ExternalLink, MessageCircle, Mail, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ShareGroupLinkProps {
  groupId: string;
  groupName: string;
}

export const ShareGroupLink = ({ groupId, groupName }: ShareGroupLinkProps) => {
  const { t } = useLanguage();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadExistingLink();
  }, [groupId]);

  const loadExistingLink = async () => {
    try {
      const { data, error } = await supabase
        .from('group_share_links')
        .select('share_token')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const link = `${window.location.origin}/shared/${data.share_token}`;
        setShareLink(link);
      }
    } catch (err) {
      console.error('Error loading share link:', err);
    }
  };

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const token = crypto.randomUUID();

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error: deactivateError } = await supabase
        .from('group_share_links')
        .update({ is_active: false })
        .eq('group_id', groupId)
        .eq('is_active', true);

      if (deactivateError) throw deactivateError;

      const { error: insertError } = await supabase
        .from('group_share_links')
        .insert({
          group_id: groupId,
          share_token: token,
          created_by: userData.user.id,
          is_active: true,
        });

      if (insertError) throw insertError;

      const link = `${window.location.origin}/shared/${token}`;
      setShareLink(link);
    } catch (err: any) {
      console.error('Error generating share link:', err);
      alert(t('share.error'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openLink = () => {
    if (shareLink) {
      window.open(shareLink, '_blank');
    }
  };

  const shareViaWhatsApp = () => {
    if (!shareLink) return;
    const message = `Join our Likelemba group "${groupName}"! Click this link to view details: ${shareLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareViaMessenger = () => {
    if (!shareLink) return;
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareLink)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    if (!shareLink) return;
    const subject = `Join our Likelemba group: ${groupName}`;
    const body = `You're invited to join our Likelemba group "${groupName}"!\n\nClick this link to view details and join:\n${shareLink}\n\nLooking forward to having you in the group!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const shareViaSMS = () => {
    if (!shareLink) return;
    const message = `Join our Likelemba group "${groupName}"! ${shareLink}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span>{t('share.buttonText')}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">{t('share.title')}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 mb-6">
              {t('share.description')}
            </p>

            {shareLink ? (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">{t('share.activeLink')}</p>
                  <p className="text-xs text-slate-800 break-all font-mono bg-white p-2 rounded border">
                    {shareLink}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{t('share.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>{t('share.copyLink')}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={openLink}
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Share via:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={shareViaWhatsApp}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={shareViaMessenger}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                      <span>Messenger</span>
                    </button>

                    <button
                      onClick={shareViaEmail}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      <span>Email</span>
                    </button>

                    <button
                      onClick={shareViaSMS}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>SMS</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={generateShareLink}
                  disabled={loading}
                  className="w-full px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-sm"
                >
                  {t('share.generateNew')}
                </button>
              </div>
            ) : (
              <button
                onClick={generateShareLink}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Share2 className="w-5 h-5" />
                <span>{loading ? t('share.generating') : t('share.generate')}</span>
              </button>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                {t('share.warning')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
