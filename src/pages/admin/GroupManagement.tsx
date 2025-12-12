import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminLayout } from '../../components/Layout/AdminLayout';
import { Building2, Users, DollarSign, Calendar, Search } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  creator_id: string;
  creator_name: string;
  number_of_members: number;
  monthly_amount: number;
  payment_frequency: string;
  start_date: string;
  status: string;
  created_at: string;
}

export default function GroupManagement() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const { data, error } = await supabase
        .from('likelemba_groups')
        .select(`
          *,
          profiles!likelemba_groups_creator_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithCreator = data?.map(group => ({
        ...group,
        creator_name: (group.profiles as any)?.full_name || 'Unknown',
      })) || [];

      setGroups(groupsWithCreator);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.creator_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      paused: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('admin.groups.title')}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{t('admin.groups.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.groups.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">{t('admin.groups.allStatuses')}</option>
              <option value="active">{t('admin.groups.active')}</option>
              <option value="paused">{t('admin.groups.paused')}</option>
              <option value="completed">{t('admin.groups.completed')}</option>
              <option value="cancelled">{t('admin.groups.cancelled')}</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <div key={group.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary-100 p-2 rounded-lg">
                        <Building2 className="w-6 h-6 text-primary-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{group.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{group.creator_name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {t('admin.groups.members')}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">{group.number_of_members}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        {t('admin.groups.amount')}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">${group.monthly_amount}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {t('admin.groups.startDate')}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {new Date(group.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(group.status)}`}>
                      {t(`admin.groups.${group.status}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredGroups.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{t('admin.groups.noGroups')}</h3>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('admin.groups.totalGroups')}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{groups.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('admin.groups.activeGroups')}</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {groups.filter(g => g.status === 'active').length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('admin.groups.totalMembers')}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {groups.reduce((sum, g) => sum + g.number_of_members, 0)}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
