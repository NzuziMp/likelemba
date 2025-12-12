import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbdhxwmzljwrwvifxnqt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZGh4d216bGp3cnd2aWZ4bnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTQ5NDksImV4cCI6MjA4MDAzMDk0OX0.TZ8dtAjXaoGIn-cL3eqEFccbEo4tHjYZRgpAl_rn8bQ';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          address: string | null;
          is_maman_likelemba: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          address?: string | null;
          is_maman_likelemba?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          address?: string | null;
          is_maman_likelemba?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      likelemba_groups: {
        Row: {
          id: string;
          name: string;
          creator_id: string;
          number_of_members: number;
          monthly_amount: number;
          payment_frequency: 'daily' | 'weekly' | 'monthly';
          payment_method: 'interac' | 'cash';
          start_date: string;
          end_date: string;
          service_fee_paid: boolean;
          status: 'active' | 'completed' | 'cancelled';
          current_cycle: number;
          current_beneficiary_id: string | null;
          cycle_start_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          creator_id: string;
          number_of_members: number;
          monthly_amount: number;
          payment_frequency: 'daily' | 'weekly' | 'monthly';
          payment_method: 'interac' | 'cash';
          start_date: string;
          end_date: string;
          service_fee_paid?: boolean;
          status?: 'active' | 'completed' | 'cancelled';
          current_cycle?: number;
          current_beneficiary_id?: string | null;
          cycle_start_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          creator_id?: string;
          number_of_members?: number;
          monthly_amount?: number;
          payment_frequency?: 'daily' | 'weekly' | 'monthly';
          payment_method?: 'interac' | 'cash';
          start_date?: string;
          end_date?: string;
          service_fee_paid?: boolean;
          status?: 'active' | 'completed' | 'cancelled';
          current_cycle?: number;
          current_beneficiary_id?: string | null;
          cycle_start_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          full_name: string;
          email: string;
          phone: string;
          address: string | null;
          membership_amount: number;
          receipt_order: number;
          has_received: boolean;
          payment_date: string | null;
          has_paid_current_cycle: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          full_name: string;
          email: string;
          phone: string;
          address?: string | null;
          membership_amount: number;
          receipt_order: number;
          has_received?: boolean;
          payment_date?: string | null;
          has_paid_current_cycle?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          address?: string | null;
          membership_amount?: number;
          receipt_order?: number;
          has_received?: boolean;
          payment_date?: string | null;
          has_paid_current_cycle?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_schedules: {
        Row: {
          id: string;
          group_id: string;
          cycle_number: number;
          payment_date: string;
          beneficiary_id: string;
          total_amount: number;
          status: 'pending' | 'completed' | 'overdue';
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          cycle_number: number;
          payment_date: string;
          beneficiary_id: string;
          total_amount: number;
          status?: 'pending' | 'completed' | 'overdue';
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          cycle_number?: number;
          payment_date?: string;
          beneficiary_id?: string;
          total_amount?: number;
          status?: 'pending' | 'completed' | 'overdue';
          created_at?: string;
        };
      };
    };
  };
};
