import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';

interface PayoutRecord {
  id: string;
  cycle_number: number;
  payment_date: string;
  beneficiary_id: string;
  beneficiary_name: string;
  total_amount: number;
  status: string;
  group_id: string;
  group_name: string;
  member_count: number;
  payments_received: number;
}

interface Group {
  id: string;
  name: string;
  number_of_members: number;
  monthly_amount: number;
  payment_frequency: string;
  start_date: string;
}

export default function PayoutHistory() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [payoutRecords, setPayoutRecords] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchPayoutRecords(selectedGroupId);
    }
  }, [selectedGroupId]);

  async function fetchGroups() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('likelemba_groups')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);

      if (data && data.length > 0) {
        setSelectedGroupId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayoutRecords(groupId: string) {
    try {
      setLoading(true);

      const { data: schedules, error: schedulesError } = await supabase
        .from('payment_schedules')
        .select(`
          id,
          cycle_number,
          payment_date,
          beneficiary_id,
          total_amount,
          status,
          group_id
        `)
        .eq('group_id', groupId)
        .order('cycle_number', { ascending: true });

      if (schedulesError) throw schedulesError;

      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('id, full_name')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      const memberMap = new Map(members?.map(m => [m.id, m.full_name]) || []);

      const records: PayoutRecord[] = await Promise.all(
        (schedules || []).map(async (schedule) => {
          const { data: payments } = await supabase
            .from('member_payments')
            .select('status')
            .eq('schedule_id', schedule.id)
            .eq('status', 'paid');

          const group = groups.find(g => g.id === groupId);

          return {
            id: schedule.id,
            cycle_number: schedule.cycle_number,
            payment_date: schedule.payment_date,
            beneficiary_id: schedule.beneficiary_id,
            beneficiary_name: memberMap.get(schedule.beneficiary_id) || 'Unknown',
            total_amount: schedule.total_amount,
            status: schedule.status,
            group_id: schedule.group_id,
            group_name: group?.name || '',
            member_count: group?.number_of_members || 0,
            payments_received: payments?.length || 0,
          };
        })
      );

      setPayoutRecords(records);
    } catch (error) {
      console.error('Error fetching payout records:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">
            {t('payoutHistory.noGroups')}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t('payoutHistory.noGroupsDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('payoutHistory.title')}</h1>
        <p className="mt-2 text-slate-600">{t('payoutHistory.subtitle')}</p>
      </div>

      <div className="mb-6">
        <label htmlFor="group-select" className="block text-sm font-medium text-slate-700 mb-2">
          {t('payoutHistory.selectGroup')}
        </label>
        <select
          id="group-select"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.number_of_members} {t('payoutHistory.members')})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : payoutRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">
            {t('payoutHistory.noCycles')}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t('payoutHistory.noCyclesDesc')}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t('payoutHistory.cycle')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t('payoutHistory.beneficiary')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t('payoutHistory.paymentDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t('payoutHistory.totalAmount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t('payoutHistory.contributions')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t('payoutHistory.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {payoutRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {record.cycle_number}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {record.beneficiary_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(record.payment_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-semibold text-slate-900">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {record.total_amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-500">
                        <Users className="w-4 h-4 mr-2" />
                        {record.payments_received}/{record.member_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {t(`payoutHistory.${record.status}`)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          {t('payoutHistory.howItWorks')}
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('payoutHistory.howItWorksLine1')}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('payoutHistory.howItWorksLine2')}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('payoutHistory.howItWorksLine3')}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>{t('payoutHistory.howItWorksLine4')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
