import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { UserLayout } from '../components/Layout/UserLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircle, Circle, Mail, AlertCircle, Calendar, DollarSign, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { calculateNextPaymentDate } from '../utils/paymentUtils';
import { ShareGroupLink } from '../components/ShareGroupLink';

interface PaymentRecord {
  id: string;
  member_id: string;
  member_name: string;
  member_email: string;
  amount_due: number;
  amount_paid: number;
  is_paid: boolean;
  payment_date: string | null;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  cycle_number: number;
}

interface MonthlyPayments {
  month: string;
  monthDate: Date;
  cycleNumber: number;
  payments: PaymentRecord[];
  paidCount: number;
  totalCount: number;
}

interface GroupInfo {
  id: string;
  name: string;
  payment_frequency: string;
  current_cycle: number;
  monthly_amount: number;
  start_date: string;
  number_of_members: number;
}

export const PaymentTracking = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('likelemba_groups')
        .select('id, name, payment_frequency, current_cycle, monthly_amount, start_date, number_of_members')
        .eq('id', groupId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError(t('payment.groupNotFound') || 'Group not found');
        setLoading(false);
        return;
      }

      setGroup(data);
      await fetchAllPayments(data);
    } catch (error) {
      console.error('Error fetching group:', error);
      setError(t('payment.errorLoading') || 'Error loading group data');
      setLoading(false);
    }
  };

  const fetchAllPayments = async (groupData: GroupInfo) => {
    if (!groupId || !groupData) return;

    try {
      setLoading(true);

      const cycles = groupData.current_cycle || 1;
      const monthlyData: MonthlyPayments[] = [];

      for (let cycle = 1; cycle <= cycles; cycle++) {
        const { data: existingPayments, error: fetchError } = await supabase
          .from('member_payment_history')
          .select(`
            id,
            member_id,
            cycle_number,
            amount_due,
            amount_paid,
            is_paid,
            payment_date,
            reminder_sent,
            reminder_sent_at,
            group_members!inner(full_name, email)
          `)
          .eq('group_id', groupId)
          .eq('cycle_number', cycle);

        if (fetchError) throw fetchError;

        if (!existingPayments || existingPayments.length === 0) {
          await createPaymentRecordsForCycle(cycle);
          const { data: newPayments } = await supabase
            .from('member_payment_history')
            .select(`
              id,
              member_id,
              cycle_number,
              amount_due,
              amount_paid,
              is_paid,
              payment_date,
              reminder_sent,
              reminder_sent_at,
              group_members!inner(full_name, email)
            `)
            .eq('group_id', groupId)
            .eq('cycle_number', cycle);

          if (newPayments) {
            const formattedPayments = formatPayments(newPayments);
            const monthDate = calculateNextPaymentDate(
              new Date(groupData.start_date),
              groupData.payment_frequency,
              cycle
            );
            monthlyData.push(createMonthlyPayment(cycle, monthDate, formattedPayments));
          }
        } else {
          const formattedPayments = formatPayments(existingPayments);
          const monthDate = calculateNextPaymentDate(
            new Date(groupData.start_date),
            groupData.payment_frequency,
            cycle
          );
          monthlyData.push(createMonthlyPayment(cycle, monthDate, formattedPayments));
        }
      }

      setMonthlyPayments(monthlyData);

      if (monthlyData.length > 0) {
        setExpandedMonths(new Set([monthlyData[monthlyData.length - 1].month]));
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPayments = (data: any[]): PaymentRecord[] => {
    return data.map((payment: any) => ({
      id: payment.id,
      member_id: payment.member_id,
      member_name: payment.group_members.full_name,
      member_email: payment.group_members.email,
      amount_due: payment.amount_due,
      amount_paid: payment.amount_paid,
      is_paid: payment.is_paid,
      payment_date: payment.payment_date,
      reminder_sent: payment.reminder_sent,
      reminder_sent_at: payment.reminder_sent_at,
      cycle_number: payment.cycle_number,
    }));
  };

  const createMonthlyPayment = (cycle: number, monthDate: Date, payments: PaymentRecord[]): MonthlyPayments => {
    const paidCount = payments.filter(p => p.is_paid).length;
    return {
      month: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      monthDate,
      cycleNumber: cycle,
      payments,
      paidCount,
      totalCount: payments.length,
    };
  };

  const createPaymentRecordsForCycle = async (cycle: number) => {
    if (!groupId) return;

    try {
      const { data: members } = await supabase
        .from('group_members')
        .select('id, membership_amount')
        .eq('group_id', groupId);

      if (!members || members.length === 0) return;

      const records = members.map(member => ({
        group_id: groupId,
        member_id: member.id,
        cycle_number: cycle,
        amount_due: member.membership_amount,
      }));

      await supabase
        .from('member_payment_history')
        .insert(records);
    } catch (error) {
      console.error('Error creating payment records:', error);
    }
  };

  const handleTogglePayment = async (paymentId: string, memberId: string, currentStatus: boolean, cycle: number) => {
    try {
      const updates: any = {
        is_paid: !currentStatus,
      };

      if (!currentStatus) {
        updates.payment_date = new Date().toISOString();
        updates.marked_paid_by = user?.id;
        updates.amount_paid = monthlyPayments
          .find(m => m.cycleNumber === cycle)?.payments
          .find(p => p.id === paymentId)?.amount_due || 0;
      } else {
        updates.payment_date = null;
        updates.amount_paid = 0;
      }

      const { error } = await supabase
        .from('member_payment_history')
        .update(updates)
        .eq('id', paymentId);

      if (error) throw error;

      if (group && cycle === group.current_cycle) {
        const { error: memberError } = await supabase
          .from('group_members')
          .update({ has_paid_current_cycle: !currentStatus })
          .eq('id', memberId);

        if (memberError) console.error('Error updating member status:', memberError);
      }

      if (group) {
        await fetchAllPayments(group);
      }
    } catch (error) {
      console.error('Error toggling payment:', error);
      alert(t('payment.updateFailed'));
    }
  };

  const handleSendReminder = async (payment: PaymentRecord) => {
    if (!group) return;

    try {
      setSendingReminder(payment.id);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-member-payment-reminder`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberEmail: payment.member_email,
            memberName: payment.member_name,
            groupName: group.name,
            amountDue: payment.amount_due,
            cycleNumber: payment.cycle_number,
            paymentFrequency: group.payment_frequency,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      const { error } = await supabase
        .from('member_payment_history')
        .update({
          reminder_sent: true,
          reminder_sent_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (error) throw error;

      if (group) {
        await fetchAllPayments(group);
      }
      alert(t('payment.reminderSent').replace('{name}', payment.member_name));
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert(t('payment.reminderFailed'));
    } finally {
      setSendingReminder(null);
    }
  };

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return t('payment.daily');
      case 'weekly': return t('payment.weekly');
      case 'monthly': return t('payment.monthly');
      default: return frequency;
    }
  };

  const totalPaid = monthlyPayments.reduce((sum, m) => sum + m.paidCount, 0);
  const totalPayments = monthlyPayments.reduce((sum, m) => sum + m.totalCount, 0);
  const overallPercentage = totalPayments > 0 ? (totalPaid / totalPayments) * 100 : 0;

  if (!groupId) {
    return (
      <UserLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('payment.noGroupSelected')}</h2>
          <p className="text-slate-600 dark:text-slate-300">{t('payment.selectGroup')}</p>
        </div>
      </UserLayout>
    );
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('payment.error') || 'Error'}</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('payment.retry') || 'Retry'}
          </button>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('payment.title')}</h1>
                {group && (
                  <p className="text-slate-600 dark:text-slate-300">
                    {group.name} - {getFrequencyText(group.payment_frequency)} {t('payment.contributions')}
                  </p>
                )}
              </div>
            </div>

            {group && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Link
                  to={`/members?group=${group.id}`}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  <Users className="w-4 h-4" />
                  <span>Members</span>
                </Link>
                <Link
                  to={`/payment-tracking?group=${group.id}`}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Payments</span>
                </Link>
                <ShareGroupLink groupId={group.id} groupName={group.name} />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-4 border-2 border-primary-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary-700 font-medium">{t('payment.totalPaid')}</span>
                <CheckCircle className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-3xl font-bold text-primary-900">{totalPaid}</p>
              <p className="text-sm text-primary-600">{t('payment.ofPayments').replace('{total}', String(totalPayments))}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 font-medium">{t('payment.completion')}</span>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-900">{overallPercentage.toFixed(0)}%</p>
              <p className="text-sm text-blue-600">{t('payment.overallProgress')}</p>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border-2 border-violet-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-violet-700 font-medium">{t('payment.periods')}</span>
                <Calendar className="w-5 h-5 text-violet-600" />
              </div>
              <p className="text-3xl font-bold text-violet-900">{monthlyPayments.length}</p>
              <p className="text-sm text-violet-600">{getFrequencyText(group?.payment_frequency || '')} {t('payment.cycles')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {monthlyPayments.map((monthData) => {
            const isExpanded = expandedMonths.has(monthData.month);
            const percentage = monthData.totalCount > 0 ? (monthData.paidCount / monthData.totalCount) * 100 : 0;
            const isCurrentCycle = group && monthData.cycleNumber === group.current_cycle;

            return (
              <div
                key={monthData.month}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all ${
                  isCurrentCycle ? 'border-primary-500' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => toggleMonth(monthData.month)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Calendar className={`w-6 h-6 ${isCurrentCycle ? 'text-primary-600' : 'text-slate-600'}`} />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{monthData.month}</h3>
                        {isCurrentCycle && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                            {t('payment.current')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('payment.cycle')} {monthData.cycleNumber} - {monthData.paidCount} of {monthData.totalCount} {t('payment.paid')} ({percentage.toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:block w-64">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Progress</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 shadow-sm"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">Hide</span>
                          <ChevronUp className="w-6 h-6 text-primary-600" />
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">Expand</span>
                          <ChevronDown className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t-2 border-slate-100">
                    <div className="p-6">
                      <div className="space-y-3">
                        {monthData.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className={`border-2 rounded-lg p-4 transition-all relative ${
                              payment.is_paid
                                ? 'border-green-300 bg-green-50 shadow-sm'
                                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                            }`}
                          >
                            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-lg ${
                              payment.is_paid ? 'bg-green-500' : 'bg-slate-400'
                            }`}></div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <button
                                  onClick={() => handleTogglePayment(payment.id, payment.member_id, payment.is_paid, monthData.cycleNumber)}
                                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
                                    payment.is_paid
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-slate-400 text-white hover:bg-slate-500'
                                  }`}
                                >
                                  {payment.is_paid ? (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      <span>{t('members.paid')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Circle className="w-4 h-4" />
                                      <span>{t('payment.markPaid')}</span>
                                    </>
                                  )}
                                </button>

                                <div className="flex items-center space-x-3 flex-1">
                                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {payment.member_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{payment.member_name}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{payment.member_email}</p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="font-bold text-slate-900 dark:text-white">${payment.amount_due.toFixed(2)}</p>
                                  {payment.payment_date && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {new Date(payment.payment_date).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {!payment.is_paid && (
                                <div className="ml-4">
                                  <button
                                    onClick={() => handleSendReminder(payment)}
                                    disabled={sendingReminder === payment.id}
                                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                                  >
                                    <Mail className="w-4 h-4" />
                                    <span>{sendingReminder === payment.id ? t('payment.sending') : t('payment.remind')}</span>
                                  </button>
                                  {payment.reminder_sent && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                                      {t('payment.sent')} {new Date(payment.reminder_sent_at!).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {monthlyPayments.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300">{t('payment.noPeriods')}</p>
          </div>
        )}
      </div>
    </UserLayout>
  );
};
