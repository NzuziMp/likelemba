import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { Users, Building2, DollarSign, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../../components/Layout/AdminLayout';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  activeGroups: number;
  totalRevenue: number;
  pendingMessages: number;
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  action: string;
  admin_name: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalGroups: 0,
    activeGroups: 0,
    totalRevenue: 0,
    pendingMessages: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      const [
        usersResult,
        groupsResult,
        revenueResult,
        messagesResult,
        activityResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id, account_status', { count: 'exact' }),
        supabase.from('likelemba_groups').select('id, status', { count: 'exact' }),
        supabase.from('service_fee_payments').select('amount').eq('status', 'paid'),
        supabase.from('contact_messages').select('id', { count: 'exact' }).eq('status', 'new'),
        supabase
          .from('admin_activity_log')
          .select(`
            id,
            action,
            created_at,
            admin_id,
            profiles!admin_activity_log_admin_id_fkey(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const activeUsers = usersResult.data?.filter(u => u.account_status === 'active').length || 0;
      const activeGroups = groupsResult.data?.filter(g => g.status === 'active').length || 0;
      const totalRevenue = revenueResult.data?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      const recentActivity = activityResult.data?.map(log => ({
        id: log.id,
        action: log.action,
        admin_name: (log.profiles as any)?.full_name || 'Unknown',
        created_at: log.created_at,
      })) || [];

      setStats({
        totalUsers: usersResult.count || 0,
        activeUsers,
        totalGroups: groupsResult.count || 0,
        activeGroups,
        totalRevenue,
        pendingMessages: messagesResult.count || 0,
        recentActivity,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: t('admin.dashboard.totalUsers'),
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} ${t('admin.dashboard.active')}`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: t('admin.dashboard.totalGroups'),
      value: stats.totalGroups,
      subtitle: `${stats.activeGroups} ${t('admin.dashboard.active')}`,
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      title: t('admin.dashboard.totalRevenue'),
      value: `$${stats.totalRevenue.toFixed(2)}`,
      subtitle: t('admin.dashboard.serviceFees'),
      icon: DollarSign,
      color: 'bg-purple-500',
    },
    {
      title: t('admin.dashboard.pendingMessages'),
      value: stats.pendingMessages,
      subtitle: t('admin.dashboard.needsResponse'),
      icon: MessageSquare,
      color: 'bg-orange-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('admin.dashboard.title')}</h1>
          <p className="mt-2 text-slate-600">{t('admin.dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{card.subtitle}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {t('admin.dashboard.recentActivity')}
              </h2>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {stats.recentActivity.length === 0 ? (
                <p className="text-slate-500 text-center py-8">{t('admin.dashboard.noActivity')}</p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-slate-900">{activity.action}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {activity.admin_name} • {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {t('admin.dashboard.systemHealth')}
              </h2>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">
                    {t('admin.dashboard.databaseStatus')}
                  </span>
                </div>
                <span className="text-sm text-green-600">{t('admin.dashboard.operational')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">
                    {t('admin.dashboard.apiStatus')}
                  </span>
                </div>
                <span className="text-sm text-green-600">{t('admin.dashboard.operational')}</span>
              </div>
              {stats.pendingMessages > 5 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-slate-900">
                      {t('admin.dashboard.highMessageVolume')}
                    </span>
                  </div>
                  <span className="text-sm text-orange-600">{t('admin.dashboard.attention')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
