import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { UserLayout } from '../components/Layout/UserLayout';
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle, Users, ArrowLeft, TrendingUp, Wallet } from 'lucide-react';

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  receipt_order: number;
  membership_amount: number;
  payout_received: boolean;
  payout_date: string | null;
  payout_amount: number | null;
  interac_transfer_mode?: string;
  interac_account_email?: string;
  interac_account_phone?: string;
}

interface Group {
  id: string;
  name: string;
  number_of_members: number;
  monthly_amount: number;
  payment_frequency: string;
  start_date: string;
  current_cycle: number;
  group_funds_balance: number;
  total_per_cycle: number;
}

export default function PayoutHistory() {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');
  const { t } = useLanguage();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  async function fetchGroupData() {
    try {
      setLoading(true);

      const { data: groupData, error: groupError } = await supabase
        .from('likelemba_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('receipt_order', { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markPayoutReceived(memberId: string, amount: number) {
    try {
      setProcessingPayout(memberId);

      const { error: updateError } = await supabase
        .from('group_members')
        .update({
          payout_received: true,
          payout_date: new Date().toISOString(),
          payout_amount: amount,
        })
        .eq('id', memberId);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('group_funds_transactions')
        .insert({
          group_id: groupId,
          member_id: memberId,
          cycle_number: group?.current_cycle || 1,
          amount: amount,
          transaction_type: 'payout',
          transaction_method: group?.payment_method || 'interac',
          notes: `Payout to member for cycle ${group?.current_cycle || 1}`,
        });

      if (transactionError) throw transactionError;

      const newBalance = (group?.group_funds_balance || 0) - amount;
      const { error: balanceError } = await supabase
        .from('likelemba_groups')
        .update({ group_funds_balance: newBalance })
        .eq('id', groupId);

      if (balanceError) throw balanceError;

      await fetchGroupData();
      alert('Payout marked as received successfully!');
    } catch (error) {
      console.error('Error marking payout:', error);
      alert('Error marking payout as received. Please try again.');
    } finally {
      setProcessingPayout(null);
    }
  }

  if (!groupId) {
    return (
      <UserLayout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">
            No Group Selected
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Please select a group from the dashboard
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </UserLayout>
    );
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UserLayout>
    );
  }

  if (!group) {
    return (
      <UserLayout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">
            Group Not Found
          </h3>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </UserLayout>
    );
  }

  const totalPayoutsGiven = members.filter(m => m.payout_received).length;
  const totalPayoutAmount = members
    .filter(m => m.payout_received)
    .reduce((sum, m) => sum + (m.payout_amount || 0), 0);

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Payout Tracking - {group.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              Track and manage member payouts for each cycle
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Group Balance</p>
            <p className="text-3xl font-bold">${(group.group_funds_balance || 0).toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Payouts Given</p>
            <p className="text-3xl font-bold">{totalPayoutsGiven}/{group.number_of_members}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-orange-100 text-sm font-medium mb-1">Total Paid Out</p>
            <p className="text-3xl font-bold">${totalPayoutAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Member Payouts</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Order
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Member Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Contact Info
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Expected Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Payout Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <span className="text-blue-700 dark:text-blue-300 font-bold">
                          #{member.receipt_order}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{member.full_name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{member.email}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {member.interac_transfer_mode === 'email' && member.interac_account_email && (
                        <div>Email: {member.interac_account_email}</div>
                      )}
                      {member.interac_transfer_mode === 'phone' && member.interac_account_phone && (
                        <div>Phone: {member.interac_account_phone}</div>
                      )}
                      {!member.interac_transfer_mode && <div>Phone: {member.phone}</div>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center font-semibold text-slate-900 dark:text-white">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {(group.total_per_cycle || group.monthly_amount * group.number_of_members).toFixed(2)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {member.payout_received ? (
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Paid Out
                          </div>
                          {member.payout_date && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(member.payout_date).toLocaleDateString()}
                            </div>
                          )}
                          {member.payout_amount && (
                            <div className="text-xs font-medium text-green-600 dark:text-green-400">
                              ${member.payout_amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          Pending
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {!member.payout_received && (
                        <button
                          onClick={() => markPayoutReceived(member.id, group.total_per_cycle || group.monthly_amount * group.number_of_members)}
                          disabled={processingPayout === member.id}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingPayout === member.id ? 'Processing...' : 'Mark as Paid'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            How Payouts Work
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Each member receives a payout when it's their turn based on their receipt order.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The payout amount is the total collected per cycle from all members.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>When you mark a payout as paid, it updates the group balance and records the transaction.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Payouts can be sent via Interac e-Transfer to the member's preferred contact method.</span>
            </li>
          </ul>
        </div>
      </div>
    </UserLayout>
  );
}
