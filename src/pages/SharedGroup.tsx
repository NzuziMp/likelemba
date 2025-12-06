import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { Users, Calendar, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Payment {
  payment_id: string | null;
  payment_date: string | null;
  amount_paid: number | null;
  cycle_number: number | null;
}

interface Member {
  member_id: string;
  member_name: string;
  member_email: string;
  member_phone: string;
  receipt_order: number;
  payments: Payment[];
}

interface GroupData {
  group_id: string;
  group_name: string;
  amount_per_member: number;
  payment_frequency: string;
  start_date: string;
  members: Member[];
}

export const SharedGroup = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useLanguage();
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!token) {
        setError(t('shared.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.rpc('get_shared_group_data', {
          token: token,
        });

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setError(t('shared.notFound'));
          setLoading(false);
          return;
        }

        const membersMap = new Map<string, Member>();

        data.forEach((row: any) => {
          if (!membersMap.has(row.member_id)) {
            membersMap.set(row.member_id, {
              member_id: row.member_id,
              member_name: row.member_name,
              member_email: row.member_email,
              member_phone: row.member_phone,
              receipt_order: row.receipt_order,
              payments: [],
            });
          }

          if (row.payment_id) {
            membersMap.get(row.member_id)!.payments.push({
              payment_id: row.payment_id,
              payment_date: row.payment_date,
              amount_paid: row.amount_paid,
              cycle_number: row.cycle_number,
            });
          }
        });

        const firstRow = data[0];
        setGroupData({
          group_id: firstRow.group_id,
          group_name: firstRow.group_name,
          amount_per_member: firstRow.amount_per_member,
          payment_frequency: firstRow.payment_frequency,
          start_date: firstRow.start_date,
          members: Array.from(membersMap.values()).sort((a, b) => a.receipt_order - b.receipt_order),
        });
      } catch (err: any) {
        console.error('Error fetching shared data:', err);
        setError(t('shared.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();
  }, [token]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-lg text-slate-600">{t('common.loading')}</div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !groupData) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">{t('common.error')}</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-8 py-12 text-white">
              <h1 className="text-3xl font-bold mb-4">{groupData.group_name}</h1>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-8 h-8" />
                  <div>
                    <p className="text-primary-100 text-sm">{t('likelemba.amountPerMember')}</p>
                    <p className="text-xl font-bold">{formatCurrency(groupData.amount_per_member)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-8 h-8" />
                  <div>
                    <p className="text-primary-100 text-sm">{t('likelemba.paymentFrequency')}</p>
                    <p className="text-xl font-bold capitalize">{groupData.payment_frequency}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8" />
                  <div>
                    <p className="text-primary-100 text-sm">{t('members.title')}</p>
                    <p className="text-xl font-bold">{groupData.members.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {t('shared.paymentsTitle')}
              </h2>

              <div className="space-y-6">
                {groupData.members.map((member) => (
                  <div
                    key={member.member_id}
                    className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {t('members.position')} #{member.receipt_order}
                          </span>
                          <h3 className="text-xl font-bold text-slate-900">{member.member_name}</h3>
                        </div>
                        <div className="space-y-1 text-slate-600">
                          <p className="flex items-center space-x-2">
                            <span className="text-sm">📧</span>
                            <span>{member.member_email}</span>
                          </p>
                          {member.member_phone && (
                            <p className="flex items-center space-x-2">
                              <span className="text-sm">📱</span>
                              <span>{member.member_phone}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="font-semibold text-slate-900 mb-3">
                        {t('members.paid')} ({member.payments.length})
                      </h4>
                      {member.payments.length > 0 ? (
                        <div className="space-y-2">
                          {member.payments.map((payment, idx) => (
                            <div
                              key={payment.payment_id || idx}
                              className="flex items-center justify-between bg-primary-50 rounded-lg p-3"
                            >
                              <div className="flex items-center space-x-3">
                                <CheckCircle2 className="w-5 h-5 text-primary-600" />
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {t('members.cycle')} {payment.cycle_number}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {payment.payment_date && formatDate(payment.payment_date)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary-700">
                                  {payment.amount_paid && formatCurrency(payment.amount_paid)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-slate-500 bg-slate-50 rounded-lg p-3">
                          <XCircle className="w-5 h-5" />
                          <span>{t('shared.noPayments')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-slate-600">
            <p className="text-sm">
              {t('shared.sharedBy')}
            </p>
            <p className="text-xs mt-2">
              Likelemba - {t('footer.tagline')}
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
