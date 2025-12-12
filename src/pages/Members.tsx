import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserLayout } from '../components/Layout/UserLayout';
import { supabase } from '../lib/supabase';
import { recordPayment, calculateNextPaymentDate } from '../utils/paymentUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { generateUpcomingPaymentNotifications } from '../utils/notificationUtils';
import { Plus, Edit, Trash2, Users, DollarSign, Mail, Phone, MapPin, X, CheckCircle, Calendar, Search, FileText, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { exportToPDF, exportToExcel, exportToWord } from '../utils/exportUtils';
import { parseImportFile, downloadTemplate } from '../utils/importUtils';

interface GroupMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  membership_amount: number;
  receipt_order: number;
  has_received: boolean;
  payment_date: string | null;
  has_paid_current_cycle: boolean;
  scheduled_payment_date: string | null;
}

interface LikeLembaGroup {
  id: string;
  name: string;
  number_of_members: number;
  monthly_amount: number;
  payment_frequency: 'daily' | 'weekly' | 'monthly';
  payment_method: string;
  start_date: string;
  end_date: string;
  current_cycle: number;
  total_per_cycle: number | null;
  service_fee: number | null;
  status: 'active' | 'paused' | 'ended';
  creator_id: string;
  paused_at: string | null;
  resumed_at: string | null;
  days_paused: number | null;
}

export const Members = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');

  const [group, setGroup] = useState<LikeLembaGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [error, setError] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [monthlyPayments, setMonthlyPayments] = useState<any[]>([]);
  const [processingStatusChange, setProcessingStatusChange] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    membershipAmount: '',
    receiptOrder: '',
  });

  useEffect(() => {
    fetchCurrentUser();
    if (groupId) {
      fetchGroup();
      fetchMembers();
      fetchPaymentData();
    }
  }, [groupId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = members.filter(member =>
        member.full_name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.phone.toLowerCase().includes(query)
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const fetchGroup = async () => {
    try {
      const { data, error} = await supabase
        .from('likelemba_groups')
        .select('id, name, number_of_members, monthly_amount, payment_frequency, payment_method, start_date, end_date, current_cycle, total_per_cycle, service_fee, status, creator_id, paused_at, resumed_at, days_paused')
        .eq('id', groupId)
        .single();

      await supabase.rpc('check_group_end_date');

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error('Error fetching group:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('receipt_order');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentData = async () => {
    try {
      const { data: payments, error } = await supabase
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
          group_members!inner(full_name, email, phone, address, receipt_order)
        `)
        .eq('group_members.group_id', groupId)
        .order('cycle_number', { ascending: false });

      if (error) throw error;

      const groupedPayments = payments?.reduce((acc: any, payment: any) => {
        const cycleKey = `Cycle ${payment.cycle_number}`;
        if (!acc[cycleKey]) {
          acc[cycleKey] = {
            month: cycleKey,
            monthDate: new Date(),
            cycleNumber: payment.cycle_number,
            payments: [],
            paidCount: 0,
            totalCount: 0,
          };
        }
        acc[cycleKey].payments.push({
          id: payment.id,
          member_id: payment.member_id,
          member_name: payment.group_members.full_name,
          member_email: payment.group_members.email,
          member_phone: payment.group_members.phone,
          member_address: payment.group_members.address,
          receipt_order: payment.group_members.receipt_order,
          amount_due: payment.amount_due,
          amount_paid: payment.amount_paid,
          is_paid: payment.is_paid,
          payment_date: payment.payment_date,
          reminder_sent: payment.reminder_sent,
          reminder_sent_at: payment.reminder_sent_at,
          cycle_number: payment.cycle_number,
        });
        acc[cycleKey].totalCount++;
        if (payment.is_paid) acc[cycleKey].paidCount++;
        return acc;
      }, {});

      setMonthlyPayments(Object.values(groupedPayments || {}));
    } catch (error) {
      console.error('Error fetching payment data:', error);
    }
  };

  const handleOpenModal = (member?: GroupMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        fullName: member.full_name,
        email: member.email,
        phone: member.phone,
        address: member.address || '',
        membershipAmount: member.membership_amount.toString(),
        receiptOrder: member.receipt_order.toString(),
      });
    } else {
      setEditingMember(null);
      const nextOrder = members.length > 0
        ? Math.max(...members.map(m => m.receipt_order)) + 1
        : 1;
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        membershipAmount: group?.monthly_amount.toString() || '',
        receiptOrder: nextOrder.toString(),
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setError('');
  };

  const handleOpenImportModal = () => {
    setShowImportModal(true);
    setImportFile(null);
    setImportErrors([]);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportErrors([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ];
      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFile(file);
        setImportErrors([]);
      } else {
        setImportErrors(['Please upload a valid Excel (.xlsx, .xls) or CSV file']);
        setImportFile(null);
      }
    }
  };

  const handleImportMembers = async () => {
    if (!importFile || !group) return;

    setImporting(true);
    setImportErrors([]);

    try {
      const result = await parseImportFile(importFile);

      if (!result.success) {
        setImportErrors(result.errors);
        setImporting(false);
        return;
      }

      if (members.length + result.members.length > group.number_of_members) {
        setImportErrors([
          `Cannot import ${result.members.length} members. Current: ${members.length}, Group limit: ${group.number_of_members}`,
        ]);
        setImporting(false);
        return;
      }

      const existingEmails = new Set(members.map(m => m.email.toLowerCase()));
      const duplicateEmails = result.members.filter(m => existingEmails.has(m.email.toLowerCase()));
      if (duplicateEmails.length > 0) {
        setImportErrors([
          `The following emails already exist in this group: ${duplicateEmails.map(m => m.email).join(', ')}`,
        ]);
        setImporting(false);
        return;
      }

      const existingOrders = new Set(members.map(m => m.receipt_order));
      const duplicateOrders = result.members.filter(m => existingOrders.has(m.receipt_order));
      if (duplicateOrders.length > 0) {
        setImportErrors([
          `The following receipt orders already exist: ${duplicateOrders.map(m => m.receipt_order).join(', ')}`,
        ]);
        setImporting(false);
        return;
      }

      const membersToInsert = result.members.map(member => ({
        group_id: groupId,
        full_name: member.full_name,
        email: member.email,
        phone: member.phone,
        address: member.address || null,
        membership_amount: member.membership_amount,
        receipt_order: member.receipt_order,
      }));

      const { error } = await supabase
        .from('group_members')
        .insert(membersToInsert);

      if (error) throw error;

      await fetchMembers();

      if (groupId) {
        await generateUpcomingPaymentNotifications(groupId);
      }

      alert(`Successfully imported ${result.members.length} members!`);
      handleCloseImportModal();
    } catch (err: any) {
      setImportErrors([err.message || 'Failed to import members']);
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!editingMember && group) {
        if (members.length >= group.number_of_members) {
          setError(`Cannot add more members. The group limit is ${group.number_of_members} members.`);
          return;
        }
      }

      const memberData = {
        group_id: groupId,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || null,
        membership_amount: parseFloat(formData.membershipAmount),
        receipt_order: parseInt(formData.receiptOrder),
      };

      if (editingMember) {
        const { error } = await supabase
          .from('group_members')
          .update(memberData)
          .eq('id', editingMember.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('group_members')
          .insert(memberData);

        if (error) throw error;
      }

      await fetchMembers();

      if (!editingMember && groupId) {
        await generateUpcomingPaymentNotifications(groupId);
      }

      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const handleRecordPayment = async (member: GroupMember) => {
    if (!confirm(`Record payment for ${member.full_name}?`)) return;

    setProcessingPayment(member.id);

    try {
      if (!group) throw new Error('Group information not available');

      const updatedMember = await recordPayment(
        groupId!,
        member.id,
        member.membership_amount
      );

      const memberEmails = members.map(m => m.email);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-payment-notification`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: group.name,
          memberName: updatedMember.full_name,
          amount: member.membership_amount,
          paymentDate: new Date().toISOString(),
          memberEmails,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send notification');
      }

      await fetchMembers();
      await fetchGroup();

      alert(`Payment recorded successfully for ${updatedMember.full_name}. All members have been notified.`);
    } catch (error: any) {
      console.error('Error recording payment:', error);
      alert(`Failed to record payment: ${error.message}`);
    } finally {
      setProcessingPayment(null);
    }
  };

  const getNextPaymentDate = () => {
    if (!group || !members.length) return null;

    const unpaidMembers = members
      .filter(m => !m.has_paid_current_cycle)
      .sort((a, b) => a.receipt_order - b.receipt_order);

    if (unpaidMembers.length === 0) {
      return null;
    }

    const nextUnpaidMember = unpaidMembers[0];
    return nextUnpaidMember.scheduled_payment_date
      ? new Date(nextUnpaidMember.scheduled_payment_date)
      : null;
  };

  const nextPaymentDate = getNextPaymentDate();

  const getNextPaymentMember = () => {
    if (!members.length) return null;

    const unpaidMembers = members
      .filter(m => !m.has_paid_current_cycle)
      .sort((a, b) => a.receipt_order - b.receipt_order);

    return unpaidMembers.length > 0 ? unpaidMembers[0] : null;
  };

  const nextPaymentMember = getNextPaymentMember();

  const handlePauseGroup = async () => {
    if (!confirm('Are you sure you want to pause this group? All payment schedules will be paused.')) return;

    setProcessingStatusChange(true);
    try {
      const { error } = await supabase.rpc('pause_group', { p_group_id: groupId });

      if (error) throw error;

      await fetchGroup();
      alert('Group has been paused successfully.');
    } catch (error: any) {
      console.error('Error pausing group:', error);
      alert(`Failed to pause group: ${error.message}`);
    } finally {
      setProcessingStatusChange(false);
    }
  };

  const handleResumeGroup = async () => {
    if (!confirm('Resume this group? Payment schedules will be adjusted based on the pause duration.')) return;

    setProcessingStatusChange(true);
    try {
      const { error } = await supabase.rpc('resume_group', { p_group_id: groupId });

      if (error) throw error;

      await fetchGroup();
      await fetchMembers();
      alert('Group has been resumed successfully. Payment dates have been adjusted.');
    } catch (error: any) {
      console.error('Error resuming group:', error);
      alert(`Failed to resume group: ${error.message}`);
    } finally {
      setProcessingStatusChange(false);
    }
  };

  if (!groupId) {
    return (
      <UserLayout>
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Group Selected</h2>
          <p className="text-slate-600 dark:text-slate-300">Please select a group from your dashboard</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        {group && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{group.name}</h1>
                <div className="mt-2">
                  {group.status === 'active' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Active
                    </span>
                  )}
                  {group.status === 'paused' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Paused
                    </span>
                  )}
                  {group.status === 'ended' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Ended
                    </span>
                  )}
                </div>
              </div>
              {currentUserId === group.creator_id && group.status !== 'ended' && (
                <div>
                  {group.status === 'active' ? (
                    <button
                      onClick={handlePauseGroup}
                      disabled={processingStatusChange}
                      className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingStatusChange ? 'Processing...' : 'Pause Group'}
                    </button>
                  ) : (
                    <button
                      onClick={handleResumeGroup}
                      disabled={processingStatusChange}
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingStatusChange ? 'Processing...' : 'Resume Group'}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {members.length} / {group.number_of_members} members
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                ${group.monthly_amount.toFixed(2)} per member
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {t('members.cycle')} {group.current_cycle || 1}
              </div>
              {nextPaymentDate && nextPaymentMember && group.status === 'active' && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('members.nextPayment')} {nextPaymentDate.toLocaleDateString()} ({nextPaymentMember.full_name})
                </div>
              )}
              {group.status === 'paused' && group.paused_at && (
                <div className="flex items-center text-yellow-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Paused since {new Date(group.paused_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}

        {group && group.total_per_cycle !== null && group.service_fee !== null && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Payment Cycle Details
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold">{group.number_of_members} {group.payment_frequency === 'daily' ? 'days' : group.payment_frequency === 'weekly' ? 'weeks' : 'months'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment frequency:</span>
                  <span className="font-semibold capitalize">{group.payment_frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment method:</span>
                  <span className="font-semibold capitalize">{group.payment_method}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span>Start date:</span>
                  <span className="font-semibold">{new Date(group.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>End date:</span>
                  <span className="font-semibold">{new Date(group.end_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6">
              <h3 className="font-bold text-primary-900 mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Financial Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-primary-800">
                  <span>Amount per member:</span>
                  <span className="font-bold">${group.monthly_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-primary-800">
                  <span>Total per cycle:</span>
                  <span className="font-bold">${group.total_per_cycle.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-primary-800 pt-2 border-t border-primary-300">
                  <span>Service fee (one-time):</span>
                  <span className="font-bold">${group.service_fee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-primary-300 text-xs text-primary-600">
                  Each member receives <strong>${group.total_per_cycle.toFixed(2)}</strong> when it's their turn
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6">
              <h3 className="font-bold text-emerald-900 mb-3 flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Export Reports
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => exportToPDF(group, monthlyPayments)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export as PDF</span>
                </button>
                <button
                  onClick={() => exportToExcel(group, monthlyPayments)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export as Excel</span>
                </button>
                <button
                  onClick={() => exportToWord(group, monthlyPayments)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export as Word</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('members.title')}</h2>
              {group && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {members.length} of {group.number_of_members} members added
                  {members.length >= group.number_of_members && (
                    <span className="ml-2 text-green-600 font-medium">✓ Group is full</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOpenImportModal}
                disabled={group ? members.length >= group.number_of_members : false}
                className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors ${
                  group && members.length >= group.number_of_members
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Members
              </button>
              <button
                onClick={() => handleOpenModal()}
                disabled={group ? members.length >= group.number_of_members : false}
                className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors ${
                  group && members.length >= group.number_of_members
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('members.addMember')}
              </button>
            </div>
          </div>

          {members.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-slate-900 dark:text-white placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Found {filteredMembers.length} of {members.length} members
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300 mb-4">{t('members.noMembers')}</p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Member
              </button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300 mb-2">No members found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={`border-2 rounded-xl p-6 transition-all ${
                    member.has_paid_current_cycle
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{member.full_name}</h3>
                        {member.has_paid_current_cycle && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <span className="text-sm text-green-600 font-medium">
                        Position #{member.receipt_order}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(member)}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center text-slate-600 dark:text-slate-300">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center text-slate-600 dark:text-slate-300">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                    {member.address && (
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{member.address}</span>
                      </div>
                    )}
                    <div className="flex items-center text-slate-600 dark:text-slate-300">
                      <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>${member.membership_amount.toFixed(2)} contribution</span>
                    </div>
                    {member.scheduled_payment_date && (
                      <div className="flex items-center text-blue-600 font-medium">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Scheduled: {new Date(member.scheduled_payment_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {member.payment_date && (
                      <div className="flex items-center text-green-600">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Paid: {new Date(member.payment_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRecordPayment(member)}
                      disabled={member.has_paid_current_cycle || processingPayment === member.id}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                        member.has_paid_current_cycle
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {processingPayment === member.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : member.has_paid_current_cycle ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t('members.paid')}
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          {t('members.recordPayment')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {editingMember ? t('members.editMember') : t('members.add')}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  {t('members.fullName')}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Address <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    Membership Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.membershipAmount}
                    onChange={(e) => setFormData({ ...formData, membershipAmount: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    Receipt Order
                  </label>
                  <input
                    type="number"
                    value={formData.receiptOrder}
                    onChange={(e) => setFormData({ ...formData, receiptOrder: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Import Members</h2>
              <button
                onClick={handleCloseImportModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Download Template
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Download our Excel template to ensure your file has the correct format.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download Template
                </button>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Required Columns:</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                  <li><strong>full_name</strong> - Member's full name</li>
                  <li><strong>email</strong> - Member's email address</li>
                  <li><strong>phone</strong> - Member's phone number</li>
                  <li><strong>membership_amount</strong> - Monthly contribution amount</li>
                  <li><strong>receipt_order</strong> - Position in payout order (must be unique)</li>
                  <li><strong>address</strong> - Member's address (optional)</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Upload Excel or CSV File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              {importFile && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    File selected: {importFile.name}
                  </p>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 mb-2">Import Errors:</h4>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    {importErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {group && (
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <strong>Current members:</strong> {members.length} / {group.number_of_members}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    <strong>Available slots:</strong> {group.number_of_members - members.length}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCloseImportModal}
                  disabled={importing}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportMembers}
                  disabled={!importFile || importing}
                  className="flex-1 py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {importing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Members
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
};
