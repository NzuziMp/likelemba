import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] Initializing client with URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('[Supabase] Anon key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables!');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('[Supabase] Client initialized successfully');

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
