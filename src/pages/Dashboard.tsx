import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserLayout } from '../components/Layout/UserLayout';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Users, DollarSign, Calendar, Plus, TrendingUp, Edit2, Trash2, X, Search } from 'lucide-react';
import { ShareGroupLink } from '../components/ShareGroupLink';
import { PaymentDueNotifications } from '../components/PaymentDueNotifications';
import { ServiceFeePayment } from '../components/ServiceFeePayment';

interface LikeLembaGroup {
  id: string;
  name: string;
  number_of_members: number;
  monthly_amount: number;
  status: string;
  start_date: string;
  payment_frequency?: string;
  payment_method?: string;
  service_fee?: number;
  service_fee_paid?: boolean;
  service_fee_deadline?: string;
  group_funds_balance?: number;
}

export const Dashboard = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<LikeLembaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<LikeLembaGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<LikeLembaGroup | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalGroups: 0,
    activeGroups: 0,
    totalMembers: 0,
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('=== DASHBOARD DIAGNOSTICS ===');
      console.log('Current session:', session ? 'Authenticated' : 'Not authenticated');
      console.log('User ID:', session?.user?.id);
      console.log('User email:', session?.user?.email);
      console.log('Profile loaded:', !!profile);
      console.log('Profile ID:', profile?.id);

      await supabase.rpc('check_group_end_date');

      const { data: groupsData, error } = await supabase
        .from('likelemba_groups')
        .select('id, name, number_of_members, monthly_amount, status, start_date, payment_frequency, payment_method, service_fee, service_fee_paid, service_fee_deadline, group_funds_balance, created_at, creator_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching groups:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }

      console.log('Groups fetched:', groupsData?.length || 0);
      if (groupsData && groupsData.length > 0) {
        console.log('Sample group creator_id:', groupsData[0].creator_id);
        console.log('Does it match your user ID?', groupsData[0].creator_id === session?.user?.id);
      }
      console.log('============================');
      setGroups(groupsData || []);

      const activeGroups = groupsData?.filter(g => g.status === 'active').length || 0;
      const totalMembers = groupsData?.reduce((sum, g) => sum + g.number_of_members, 0) || 0;

      setStats({
        totalGroups: groupsData?.length || 0,
        activeGroups,
        totalMembers,
      });
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('likelemba_groups')
        .update({
          name: editingGroup.name,
          monthly_amount: editingGroup.monthly_amount,
          payment_frequency: editingGroup.payment_frequency,
          payment_method: editingGroup.payment_method,
          status: editingGroup.status,
        })
        .eq('id', editingGroup.id);

      if (error) throw error;

      await fetchGroups();
      setEditingGroup(null);
      alert('Groupe mis à jour avec succès');
    } catch (error: any) {
      console.error('Error updating group:', error);
      alert('Erreur lors de la mise à jour du groupe');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup || deleteConfirmation !== deletingGroup.name) {
      alert('Veuillez taper le nom du groupe pour confirmer');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('likelemba_groups')
        .delete()
        .eq('id', deletingGroup.id);

      if (error) throw error;

      await fetchGroups();
      setDeletingGroup(null);
      setDeleteConfirmation('');
      alert('Groupe supprimé avec succès');
    } catch (error: any) {
      console.error('Error deleting group:', error);
      alert('Erreur lors de la suppression du groupe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Total Groups</p>
            <p className="text-3xl font-bold">{stats.totalGroups}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Active Groups</p>
            <p className="text-3xl font-bold">{stats.activeGroups}</p>
          </div>

          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-violet-100 text-sm font-medium mb-1">Total Members</p>
            <p className="text-3xl font-bold">{stats.totalMembers}</p>
          </div>
        </div>

        <PaymentDueNotifications />

        {profile?.is_maman_likelemba && (
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-primary-900 mb-1">Maman Likelemba Status</h3>
                <p className="text-primary-700 text-sm">
                  You are a primary member and can manage Likelemba groups for your community.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Likelemba Groups</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <Link
                to="/likelemba"
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 dark:text-slate-300 mt-4">Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Groups Found</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                {profile ? 'You can only see groups you created. Create your first group to get started.' : 'Please make sure you are logged in'}
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 max-w-2xl mx-auto text-left">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">Why can't I see any groups?</h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>The database has Row Level Security (RLS) enabled</li>
                  <li>You can ONLY see groups where YOU are the creator</li>
                  <li>Check the browser console (press F12) for detailed diagnostics</li>
                  <li>Your User ID must match the group's creator_id</li>
                  <li>Try visiting /test-auth to see authentication details</li>
                </ul>
              </div>
              {profile && (
                <>
                  <Link
                    to="/likelemba"
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors mb-4"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Group
                  </Link>
                  <div className="mt-4">
                    <Link
                      to="/test-auth"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      View Diagnostic Information
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {groups
                .filter((group) =>
                  group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  group.status.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{t('search.noResults')}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{t('search.tryAdjusting')}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {groups
                    .filter((group) =>
                      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      group.status.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((group) => (
                <div
                  key={group.id}
                  className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:border-primary-500 hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{group.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        group.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : group.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-700'
                          : group.status === 'ended'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {group.status}
                    </span>
                  </div>

                  {group.service_fee && (
                    <ServiceFeePayment
                      groupId={group.id}
                      groupName={group.name}
                      serviceFee={group.service_fee}
                      servicePaid={group.service_fee_paid || false}
                      deadline={group.service_fee_deadline || null}
                      onPaymentConfirmed={fetchGroups}
                    />
                  )}

                  <div>
                  <div className="space-y-2 text-sm">
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{group.number_of_members} members</span>
                      </div>
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>${group.monthly_amount.toFixed(2)} per member</span>
                      </div>
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Started {new Date(group.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Balance: ${(group.group_funds_balance || 0).toFixed(2)} CAD</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        to={`/members?group=${group.id}`}
                        className="block text-center px-3 py-2 bg-slate-100 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
                      >
                        Members
                      </Link>
                      <Link
                        to={`/payment-tracking?group=${group.id}`}
                        className="block text-center px-3 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-colors text-sm"
                      >
                        Payments
                      </Link>
                      <Link
                        to={`/payout-history?group=${group.id}`}
                        className="block text-center px-3 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        Payouts
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <ShareGroupLink groupId={group.id} groupName={group.name} />
                      <button
                        onClick={() => setEditingGroup(group)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>{t('dashboard.edit')}</span>
                      </button>
                      <button
                        onClick={() => setDeletingGroup(group)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{t('dashboard.delete')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.editGroup')}</h3>
              <button
                onClick={() => setEditingGroup(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {t('dashboard.groupName')}
                </label>
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {t('dashboard.amountPerMember')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingGroup.monthly_amount}
                  onChange={(e) => setEditingGroup({ ...editingGroup, monthly_amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {t('dashboard.paymentFrequency')}
                </label>
                <select
                  value={editingGroup.payment_frequency || 'monthly'}
                  onChange={(e) => setEditingGroup({ ...editingGroup, payment_frequency: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="daily">{t('likelemba.daily')}</option>
                  <option value="weekly">{t('likelemba.weekly')}</option>
                  <option value="monthly">{t('likelemba.monthly')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {t('dashboard.paymentMethod')}
                </label>
                <select
                  value={editingGroup.payment_method || 'cash'}
                  onChange={(e) => setEditingGroup({ ...editingGroup, payment_method: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="interac">{t('likelemba.interac')}</option>
                  <option value="cash">{t('likelemba.cash')}</option>
                  <option value="bank">{t('dashboard.bankTransfer')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {t('dashboard.status')}
                </label>
                <select
                  value={editingGroup.status}
                  onChange={(e) => setEditingGroup({ ...editingGroup, status: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="active">{t('dashboard.active')}</option>
                  <option value="completed">{t('dashboard.completed')}</option>
                  <option value="paused">{t('dashboard.paused')}</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? t('dashboard.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.deleteGroup')}</h3>
            </div>

            <div className="mb-6">
              <p className="text-slate-700 dark:text-slate-200 mb-4">
                {t('dashboard.deleteConfirm')} <strong>{deletingGroup.name}</strong> ?
              </p>
              <p className="text-red-600 text-sm mb-4">
                {t('dashboard.deleteWarning')}
              </p>

              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  {t('dashboard.typeToConfirm')} <strong className="text-red-600">{deletingGroup.name}</strong>
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={deletingGroup.name}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setDeletingGroup(null);
                  setDeleteConfirmation('');
                }}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={loading || deleteConfirmation !== deletingGroup.name}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('dashboard.deleting') : t('dashboard.deletePermanently')}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
};
