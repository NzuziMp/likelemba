import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { MessageSquare, Mail, Phone, Calendar, Send } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  response: string;
  responded_at: string;
  responded_by: string;
  created_at: string;
}

export default function MessageManagement() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { logActivity } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [responseText, setResponseText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function respondToMessage() {
    if (!selectedMessage || !responseText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({
          status: 'replied',
          response: responseText,
          responded_at: new Date().toISOString(),
          responded_by: user?.id,
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      await logActivity(
        'Responded to contact message',
        'contact_message',
        selectedMessage.id,
        { response_length: responseText.length }
      );

      setMessages(messages.map(m =>
        m.id === selectedMessage.id
          ? { ...m, status: 'replied', response: responseText, responded_at: new Date().toISOString() }
          : m
      ));

      setSelectedMessage(null);
      setResponseText('');
      alert(t('admin.messages.responseSuccess'));
    } catch (error) {
      console.error('Error responding to message:', error);
      alert(t('admin.messages.responseError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function markAsRead(messageId: string) {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(messages.map(m => m.id === messageId ? { ...m, status: 'read' } : m));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  const filteredMessages = messages.filter(msg =>
    statusFilter === 'all' || msg.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-yellow-100 text-yellow-800',
      replied: 'bg-green-100 text-green-800',
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('admin.messages.title')}</h1>
          <p className="mt-2 text-slate-600">{t('admin.messages.subtitle')}</p>
        </div>

        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">{t('admin.messages.allMessages')}</option>
            <option value="new">{t('admin.messages.new')}</option>
            <option value="read">{t('admin.messages.read')}</option>
            <option value="replied">{t('admin.messages.replied')}</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (message.status === 'new') {
                      markAsRead(message.id);
                    }
                  }}
                  className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMessage?.id === message.id
                      ? 'border-primary-500 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-primary-600" />
                      <h3 className="font-semibold text-slate-900">{message.name}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(message.status)}`}>
                      {t(`admin.messages.${message.status}`)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{message.message}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(message.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {message.email}
                    </span>
                  </div>
                </div>
              ))}

              {filteredMessages.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg">
                  <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">{t('admin.messages.noMessages')}</h3>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              {selectedMessage ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">{selectedMessage.name}</h2>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {selectedMessage.email}
                      </div>
                      {selectedMessage.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          {selectedMessage.phone}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="font-medium text-slate-900 mb-2">{t('admin.messages.message')}</h3>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>

                  {selectedMessage.response && (
                    <div className="pt-4 border-t border-slate-200">
                      <h3 className="font-medium text-slate-900 mb-2">{t('admin.messages.response')}</h3>
                      <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.response}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {t('admin.messages.respondedAt')}: {new Date(selectedMessage.responded_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedMessage.status !== 'replied' && (
                    <div className="pt-4 border-t border-slate-200">
                      <h3 className="font-medium text-slate-900 mb-2">{t('admin.messages.writeResponse')}</h3>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder={t('admin.messages.responsePlaceholder')}
                        rows={6}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        onClick={respondToMessage}
                        disabled={submitting || !responseText.trim()}
                        className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        <span>{submitting ? t('admin.messages.sending') : t('admin.messages.sendResponse')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-500">{t('admin.messages.selectMessage')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
