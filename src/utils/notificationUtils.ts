import { supabase } from '../lib/supabase';
import { calculateNextPaymentDate } from './paymentUtils';

export interface PaymentDueNotification {
  id: string;
  group_id: string;
  beneficiary_id: string;
  payment_due_date: string;
  amount: number;
  cycle_number: number;
  is_read: boolean;
  is_dismissed: boolean;
  email_sent: boolean;
  created_at: string;
  group_name?: string;
  beneficiary_name?: string;
}

export async function createPaymentDueNotification(
  groupId: string,
  beneficiaryId: string,
  paymentDueDate: Date,
  amount: number,
  cycleNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existingNotification } = await supabase
      .from('payment_due_notifications')
      .select('id')
      .eq('group_id', groupId)
      .eq('beneficiary_id', beneficiaryId)
      .eq('cycle_number', cycleNumber)
      .maybeSingle();

    if (existingNotification) {
      return { success: true };
    }

    const { error } = await supabase
      .from('payment_due_notifications')
      .insert({
        group_id: groupId,
        beneficiary_id: beneficiaryId,
        payment_due_date: paymentDueDate.toISOString().split('T')[0],
        amount,
        cycle_number: cycleNumber,
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error creating payment due notification:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPaymentDueReminderEmail(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: notification, error: fetchError } = await supabase
      .from('payment_due_notifications')
      .select(`
        *,
        likelemba_groups!inner(name, creator_id, profiles!inner(full_name, id)),
        group_members!inner(full_name)
      `)
      .eq('id', notificationId)
      .single();

    if (fetchError) throw fetchError;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', notification.likelemba_groups.creator_id)
      .single();

    const creatorEmail = (await supabase.auth.admin.getUserById(notification.likelemba_groups.creator_id)).data.user?.email;

    if (!creatorEmail) {
      throw new Error('Creator email not found');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-payment-due-reminder`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorEmail,
          creatorName: creatorProfile?.full_name || 'User',
          groupName: notification.likelemba_groups.name,
          beneficiaryName: notification.group_members.full_name,
          amount: notification.amount,
          paymentDueDate: notification.payment_due_date,
          cycleNumber: notification.cycle_number,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send email notification');
    }

    const { error: updateError } = await supabase
      .from('payment_due_notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    console.error('Error sending payment due reminder email:', error);
    return { success: false, error: error.message };
  }
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('payment_due_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}

export async function dismissNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('payment_due_notifications')
      .update({ is_dismissed: true, is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error dismissing notification:', error);
    return { success: false, error: error.message };
  }
}

export async function generateUpcomingPaymentNotifications(
  groupId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const { data: group, error: groupError } = await supabase
      .from('likelemba_groups')
      .select('*, group_members(*)')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;
    if (!group || group.status !== 'active') {
      return { success: true, count: 0 };
    }

    const sortedMembers = group.group_members.sort((a: any, b: any) => a.receipt_order - b.receipt_order);

    const currentCycle = group.current_cycle || 1;
    const startDate = new Date(group.start_date);

    let notificationsCreated = 0;

    for (let cycle = currentCycle; cycle <= group.number_of_members; cycle++) {
      const beneficiary = sortedMembers[cycle - 1];
      if (!beneficiary) continue;

      const paymentDate = calculateNextPaymentDate(
        startDate,
        group.payment_frequency,
        cycle
      );

      const result = await createPaymentDueNotification(
        groupId,
        beneficiary.id,
        paymentDate,
        group.total_per_cycle || (group.monthly_amount * group.number_of_members),
        cycle
      );

      if (result.success) {
        notificationsCreated++;
      }
    }

    return { success: true, count: notificationsCreated };
  } catch (error: any) {
    console.error('Error generating payment notifications:', error);
    return { success: false, error: error.message };
  }
}
