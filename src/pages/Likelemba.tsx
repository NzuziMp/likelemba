import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../components/Layout/UserLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DollarSign, Users, Calendar, CreditCard, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateUpcomingPaymentNotifications } from '../utils/notificationUtils';

export const LikeLemba = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    numberOfMembers: '',
    monthlyAmount: '',
    paymentFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    paymentMethod: 'interac' as 'interac' | 'cash',
    startDate: '',
    endDate: '',
  });

  const calculateEndDate = (startDate: string, numberOfMembers: number, frequency: 'daily' | 'weekly' | 'monthly'): string => {
    if (!startDate || !numberOfMembers || numberOfMembers < 2) return '';

    const start = new Date(startDate);
    let endDate = new Date(start);

    switch (frequency) {
      case 'daily':
        endDate.setDate(start.getDate() + numberOfMembers);
        break;
      case 'weekly':
        endDate.setDate(start.getDate() + (numberOfMembers * 7));
        break;
      case 'monthly':
        endDate.setMonth(start.getMonth() + numberOfMembers);
        break;
    }

    return endDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (formData.startDate && formData.numberOfMembers) {
      const members = parseInt(formData.numberOfMembers);
      if (members >= 2) {
        const calculatedEndDate = calculateEndDate(
          formData.startDate,
          members,
          formData.paymentFrequency
        );
        setFormData(prev => ({ ...prev, endDate: calculatedEndDate }));
      }
    }
  }, [formData.startDate, formData.numberOfMembers, formData.paymentFrequency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('Not authenticated');

      const numberOfMembers = parseInt(formData.numberOfMembers);
      const monthlyAmount = parseFloat(formData.monthlyAmount);

      if (numberOfMembers < 2) {
        throw new Error('A Likelemba group must have at least 2 members');
      }

      if (monthlyAmount <= 0) {
        throw new Error('Monthly amount must be greater than 0');
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      const serviceFee = numberOfMembers * 2;
      const totalPerCycle = monthlyAmount * numberOfMembers;

      const { data: groupData, error: groupError } = await supabase
        .from('likelemba_groups')
        .insert({
          name: formData.name,
          creator_id: user.id,
          number_of_members: numberOfMembers,
          monthly_amount: monthlyAmount,
          payment_frequency: formData.paymentFrequency,
          payment_method: formData.paymentMethod,
          start_date: formData.startDate,
          end_date: formData.endDate,
          total_per_cycle: totalPerCycle,
          service_fee: serviceFee,
          service_fee_paid: false,
          status: 'active',
        })
        .select()
        .single();

      if (groupError) throw groupError;

      await generateUpcomingPaymentNotifications(groupData.id);

      alert(`Group created successfully! Service fee: $${serviceFee.toFixed(2)} ($2 per member)`);
      navigate('/members?group=' + groupData.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const serviceFee = formData.numberOfMembers
    ? parseInt(formData.numberOfMembers) * 2
    : 0;

  const totalPerCycle = formData.monthlyAmount && formData.numberOfMembers
    ? parseFloat(formData.monthlyAmount) * parseInt(formData.numberOfMembers)
    : 0;

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('likelemba.title')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('likelemba.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                {t('likelemba.groupName')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Community Savings Group"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="numberOfMembers" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  {t('likelemba.numberOfMembers')}
                </label>
                <input
                  type="number"
                  id="numberOfMembers"
                  name="numberOfMembers"
                  value={formData.numberOfMembers}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 20"
                  min="2"
                  required
                />
              </div>

              <div>
                <label htmlFor="monthlyAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  {t('likelemba.amountPerMember')}
                </label>
                <input
                  type="number"
                  id="monthlyAmount"
                  name="monthlyAmount"
                  value={formData.monthlyAmount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 100"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="paymentFrequency" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('likelemba.paymentFrequency')}
                </label>
                <select
                  id="paymentFrequency"
                  name="paymentFrequency"
                  value={formData.paymentFrequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="interac">Interac</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {t('likelemba.startDate')}
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {t('likelemba.endDate')} <span className="text-xs text-primary-600">(Auto-calculated)</span>
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  readOnly
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-not-allowed"
                  required
                />
                {formData.endDate && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Calculated based on {formData.numberOfMembers} members with {formData.paymentFrequency} payments
                  </p>
                )}
              </div>
            </div>

            {formData.numberOfMembers && formData.startDate && formData.endDate && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-4">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Payment Cycle Details
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    <strong>Duration:</strong> {formData.numberOfMembers} {formData.paymentFrequency === 'daily' ? 'days' : formData.paymentFrequency === 'weekly' ? 'weeks' : 'months'}
                  </p>
                  <p>
                    <strong>Each member pays:</strong> Once per {formData.paymentFrequency === 'daily' ? 'day' : formData.paymentFrequency === 'weekly' ? 'week' : 'month'}
                  </p>
                  <p>
                    <strong>Each member receives payout:</strong> Once during the cycle (when it's their turn)
                  </p>
                  <p className="text-xs pt-2 border-t border-blue-300">
                    The group will run from {new Date(formData.startDate).toLocaleDateString()} to {new Date(formData.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {totalPerCycle > 0 && (
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6">
                <h3 className="font-bold text-primary-900 mb-4">{t('likelemba.summary')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-700">Total per cycle:</span>
                    <span className="font-bold text-primary-900">${totalPerCycle.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-700">Service fee (one-time):</span>
                    <span className="font-bold text-primary-900">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-primary-300 text-xs text-primary-600">
                    Each member will receive ${totalPerCycle.toFixed(2)} when it's their turn
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                t('likelemba.creating')
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {t('likelemba.createButton')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </UserLayout>
  );
};
