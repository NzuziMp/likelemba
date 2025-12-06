import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Bell, X, CheckCircle, Calendar, DollarSign, User } from 'lucide-react';
import { markNotificationAsRead, dismissNotification } from '../utils/notificationUtils';

interface Notification {
  id: string;
  group_id: string;
  beneficiary_id: string;
  payment_due_date: string;
  amount: number;
  cycle_number: number;
  is_read: boolean;
  is_dismissed: boolean;
  group_name: string;
  beneficiary_name: string;
}

export const PaymentDueNotifications = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('payment_due_notifications')
        .select(`
          *,
          likelemba_groups!inner(name),
          group_members!inner(full_name)
        `)
        .eq('is_dismissed', false)
        .gte('payment_due_date', today)
        .lte('payment_due_date', sevenDaysFromNow)
        .order('payment_due_date', { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        group_id: item.group_id,
        beneficiary_id: item.beneficiary_id,
        payment_due_date: item.payment_due_date,
        amount: item.amount,
        cycle_number: item.cycle_number,
        is_read: item.is_read,
        is_dismissed: item.is_dismissed,
        group_name: item.likelemba_groups.name,
        beneficiary_name: item.group_members.full_name,
      }));

      setNotifications(formattedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
  };

  const handleDismiss = async (notificationId: string) => {
    const result = await dismissNotification(notificationId);
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  const getDateColor = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 1) return 'text-red-600 bg-red-50 border-red-200';
    if (daysUntil <= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return t('notification.today');
    if (date.toDateString() === tomorrow.toDateString()) return t('notification.tomorrow');

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="animate-pulse flex items-center space-x-4">
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-sm border-2 border-blue-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-lg">{t('notification.title')}</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-blue-700">
                {unreadCount === 1
                  ? t('notification.unread').replace('{count}', String(unreadCount))
                  : t('notification.unreadPlural').replace('{count}', String(unreadCount))}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {displayedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative bg-white rounded-lg p-4 border-2 transition-all ${
              notification.is_read ? 'border-slate-200 opacity-75' : 'border-blue-300 shadow-sm'
            }`}
          >
            <button
              onClick={() => handleDismiss(notification.id)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
              title={t('notification.dismiss')}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pr-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDateColor(notification.payment_due_date)}`}>
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(notification.payment_due_date)}
                    </span>
                    <span className="text-xs text-slate-500">{t('notification.cycle').replace('{number}', String(notification.cycle_number))}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">{notification.group_name}</h4>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-slate-700">
                  <User className="w-4 h-4 mr-2 text-slate-400" />
                  <span dangerouslySetInnerHTML={{ __html: t('notification.payTo').replace('{name}', `<strong>${notification.beneficiary_name}</strong>`) }} />
                </div>
                <div className="flex items-center text-primary-700 font-semibold">
                  <DollarSign className="w-4 h-4 mr-2 text-primary-600" />
                  <span>${notification.amount.toFixed(2)}</span>
                </div>
              </div>

              {!notification.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="mt-3 inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {t('notification.markRead')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {showAll ? t('notification.showLess') : t('notification.showMore').replace('{count}', String(notifications.length - 3))}
        </button>
      )}
    </div>
  );
};
