import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AdminUser {
  id: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: {
    users?: boolean;
    groups?: boolean;
    payments?: boolean;
    messages?: boolean;
    faqs?: boolean;
  };
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  hasPermission: (permission: keyof AdminUser['permissions']) => boolean;
  logActivity: (action: string, targetType?: string, targetId?: string, details?: object) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setAdminUser(null);
      setLoading(false);
    }
  }, [user]);

  async function checkAdminStatus() {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, role, permissions')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAdminUser(data);
      } else {
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }

  function hasPermission(permission: keyof AdminUser['permissions']): boolean {
    if (!adminUser) return false;
    if (adminUser.role === 'super_admin') return true;
    return adminUser.permissions[permission] === true;
  }

  async function logActivity(
    action: string,
    targetType?: string,
    targetId?: string,
    details?: object
  ): Promise<void> {
    if (!adminUser) return;

    try {
      await supabase.from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details: details || {},
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  }

  const value: AdminContextType = {
    adminUser,
    isAdmin: !!adminUser,
    isSuperAdmin: adminUser?.role === 'super_admin',
    loading,
    hasPermission,
    logActivity,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
