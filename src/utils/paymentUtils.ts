import { supabase } from '../lib/supabase';

export interface PaymentSchedule {
  cycleNumber: number;
  paymentDate: Date;
  beneficiaryId: string;
  beneficiaryName: string;
}

export const calculateNextPaymentDate = (
  startDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly',
  cycleNumber: number
): Date => {
  const date = new Date(startDate);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + (cycleNumber - 1));
      break;
    case 'weekly':
      date.setDate(date.getDate() + (cycleNumber - 1) * 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + (cycleNumber - 1));
      break;
  }

  return date;
};

export const generatePaymentSchedule = async (
  groupId: string,
  startDate: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  numberOfMembers: number
) => {
  try {
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('id, full_name, receipt_order')
      .eq('group_id', groupId)
      .order('receipt_order');

    if (membersError) throw membersError;
    if (!members || members.length === 0) {
      throw new Error('No members found for this group');
    }

    const schedules: PaymentSchedule[] = members.map((member) => ({
      cycleNumber: member.receipt_order,
      paymentDate: calculateNextPaymentDate(
        new Date(startDate),
        frequency,
        member.receipt_order
      ),
      beneficiaryId: member.id,
      beneficiaryName: member.full_name,
    }));

    return schedules;
  } catch (error) {
    console.error('Error generating payment schedule:', error);
    throw error;
  }
};

export const recordPayment = async (
  groupId: string,
  memberId: string,
  amount: number
) => {
  try {
    const { data: group, error: groupError } = await supabase
      .from('likelemba_groups')
      .select('current_cycle, number_of_members, payment_frequency, start_date')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;

    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .update({
        payment_date: new Date().toISOString(),
        has_paid_current_cycle: true,
      })
      .eq('id', memberId)
      .select('full_name, receipt_order')
      .single();

    if (memberError) throw memberError;

    const { error: notificationError } = await supabase
      .from('payment_notifications')
      .insert({
        group_id: groupId,
        member_id: memberId,
        payment_date: new Date().toISOString(),
        amount_paid: amount,
        notification_sent: false,
      });

    if (notificationError) throw notificationError;

    const { data: paidMembers, error: paidError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('has_paid_current_cycle', true);

    if (paidError) throw paidError;

    const { data: totalMembers, error: totalError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId);

    if (totalError) throw totalError;

    if (paidMembers && totalMembers && paidMembers.length === totalMembers.length) {
      await advanceToNextCycle(groupId);
    }

    return member;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

export const getCurrentCycleInfo = async (groupId: string) => {
  try {
    const { data: group, error: groupError } = await supabase
      .from('likelemba_groups')
      .select(`
        current_cycle,
        current_beneficiary_id,
        cycle_start_date,
        payment_frequency,
        start_date,
        group_members!current_beneficiary_id (
          id,
          full_name,
          receipt_order
        )
      `)
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;

    return group;
  } catch (error) {
    console.error('Error fetching current cycle info:', error);
    throw error;
  }
};

export const advanceToNextCycle = async (groupId: string) => {
  try {
    const { data: group, error: groupError } = await supabase
      .from('likelemba_groups')
      .select('current_cycle, payment_frequency, start_date, number_of_members')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;

    const nextCycle = (group.current_cycle || 1) + 1;

    if (nextCycle > group.number_of_members) {
      return { nextCycle: 1, nextBeneficiary: null, cycleCompleted: true };
    }

    const { data: nextBeneficiary, error: beneficiaryError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('receipt_order', nextCycle)
      .maybeSingle();

    if (beneficiaryError) throw beneficiaryError;

    const today = new Date();
    const nextCycleStartDate = new Date(today);
    nextCycleStartDate.setHours(0, 0, 0, 0);

    await supabase
      .from('group_members')
      .update({ has_paid_current_cycle: false })
      .eq('group_id', groupId);

    const { error: updateError } = await supabase
      .from('likelemba_groups')
      .update({
        current_cycle: nextCycle,
        current_beneficiary_id: nextBeneficiary?.id || null,
        cycle_start_date: nextCycleStartDate.toISOString().split('T')[0],
      })
      .eq('id', groupId);

    if (updateError) throw updateError;

    return { nextCycle, nextBeneficiary, cycleCompleted: false };
  } catch (error) {
    console.error('Error advancing to next cycle:', error);
    throw error;
  }
};
