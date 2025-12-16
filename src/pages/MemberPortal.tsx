import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, DollarSign, Calendar, LogOut, Mail, Phone, MapPin, CreditCard, Users, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface MemberData {
  id: string;
  member_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  receipt_order: number;
  membership_amount: number;
  group_id: string;
}

interface GroupData {
  name: string;
  payment_method: string;
  frequency: string;
  current_cycle: number;
  total_cycles: number;
  interac_account_email?: string;
  interac_account_phone?: string;
  interac_transfer_mode?: string;
}

interface PaymentHistory {
  cycle_number: number;
  is_paid: boolean;
  payment_date: string | null;
}

export const MemberPortal = () => {
  const { t } = useLanguage();
  const [member, setMember] = useState<MemberData | null>(null);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMemberData = async () => {
      try {
        const sessionToken = localStorage.getItem('member_session_token');
        const memberIdCode = localStorage.getItem('member_id_code');
        const memberUuid = localStorage.getItem('member_uuid');

        if (!sessionToken || !memberIdCode || !memberUuid) {
          navigate('/member-login');
          return;
        }

        const { data: session, error: sessionError } = await supabase
          .from('member_id_sessions')
          .select('*')
          .eq('session_token', sessionToken)
          .eq('member_id', memberIdCode)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (sessionError || !session) {
          localStorage.removeItem('member_session_token');
          localStorage.removeItem('member_id_code');
          localStorage.removeItem('member_uuid');
          navigate('/member-login');
          return;
        }

        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('*')
          .eq('id', memberUuid)
          .single();

        if (memberError) throw memberError;

        setMember(memberData);

        const { data: groupData, error: groupError } = await supabase
          .from('likelemba_groups')
          .select('*')
          .eq('id', memberData.group_id)
          .single();

        if (groupError) throw groupError;

        setGroup(groupData);

        const { data: history, error: historyError } = await supabase
          .from('member_payment_history')
          .select('cycle_number, is_paid, payment_date')
          .eq('member_id', memberUuid)
          .order('cycle_number', { ascending: true });

        if (historyError) throw historyError;

        setPaymentHistory(history || []);
      } catch (err) {
        console.error('Error loading member data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMemberData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('member_session_token');
    localStorage.removeItem('member_id_code');
    localStorage.removeItem('member_uuid');
    navigate('/');
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">{t('memberPortal.loading')}</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!member || !group) {
    return null;
  }

  const paidPayments = paymentHistory.filter(p => p.is_paid).length;
  const totalPayments = group.total_cycles;

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t('memberPortal.welcome')}, {member.full_name}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">{t('memberPortal.memberId')}: {member.member_id}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('memberPortal.logout')}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{t('memberPortal.yourPosition')}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">#{member.receipt_order}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{t('memberPortal.paymentsMade')}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {paidPayments}/{totalPayments}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{t('memberPortal.currentCycle')}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {group.current_cycle}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('memberPortal.yourInformation')}
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('memberPortal.memberId')}</p>
                  <p className="font-mono font-medium text-slate-900 dark:text-white">{member.member_id}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('memberPortal.email')}</p>
                  <p className="font-medium text-slate-900 dark:text-white">{member.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('memberPortal.phone')}</p>
                  <p className="font-medium text-slate-900 dark:text-white">{member.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('memberPortal.address')}</p>
                  <p className="font-medium text-slate-900 dark:text-white">{member.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('memberPortal.contributionAmount')}</p>
                  <p className="font-medium text-slate-900 dark:text-white">${member.membership_amount} CAD</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('memberPortal.groupDetails')}
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('memberPortal.groupName')}</p>
                <p className="font-medium text-slate-900 dark:text-white">{group.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('memberPortal.paymentMethod')}</p>
                <p className="font-medium text-slate-900 dark:text-white capitalize">{group.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('memberPortal.frequency')}</p>
                <p className="font-medium text-slate-900 dark:text-white capitalize">{group.frequency}</p>
              </div>
              {group.payment_method === 'interac' && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">{t('memberPortal.interacDetails')}</p>
                  {group.interac_transfer_mode === 'email' && (
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {t('memberPortal.sendTo')}: {group.interac_account_email}
                    </p>
                  )}
                  {group.interac_transfer_mode === 'phone' && (
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {t('memberPortal.sendTo')}: {group.interac_account_phone}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('memberPortal.paymentHistory')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('memberPortal.cycle')}</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('memberPortal.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('memberPortal.date')}</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-500 dark:text-slate-400">
                      {t('memberPortal.noHistory')}
                    </td>
                  </tr>
                ) : (
                  paymentHistory.map((payment) => (
                    <tr key={payment.cycle_number} className="border-b border-slate-200 dark:border-slate-700">
                      <td className="py-3 px-4 text-slate-900 dark:text-white">
                        {t('memberPortal.cycle')} {payment.cycle_number}
                      </td>
                      <td className="py-3 px-4">
                        {payment.is_paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            {t('memberPortal.paid')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm">
                            <XCircle className="w-4 h-4" />
                            {t('memberPortal.notPaid')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
