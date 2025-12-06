import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Activity, Calendar, User, Filter } from 'lucide-react';

interface ActivityLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

export default function ActivityLog() {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  async function fetchActivityLogs() {
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select(`
          *,
          profiles!admin_activity_log_admin_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const logsWithAdminName = data?.map(log => ({
        ...log,
        admin_name: (log.profiles as any)?.full_name || 'Unknown Admin',
      })) || [];

      setActivities(logsWithAdminName);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredActivities = activities.filter(activity =>
    typeFilter === 'all' || activity.target_type === typeFilter
  );

  const uniqueTypes = Array.from(new Set(activities.map(a => a.target_type).filter(Boolean)));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('admin.activity.title')}</h1>
          <p className="mt-2 text-slate-600">{t('admin.activity.subtitle')}</p>
        </div>

        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">{t('admin.activity.allTypes')}</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {t('admin.activity.timestamp')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {t('admin.activity.admin')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {t('admin.activity.action')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {t('admin.activity.targetType')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{activity.admin_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-900">{activity.action}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.target_type && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                            {activity.target_type}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredActivities.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">{t('admin.activity.noActivity')}</h3>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>{t('admin.activity.note')}:</strong> {t('admin.activity.noteText')}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
