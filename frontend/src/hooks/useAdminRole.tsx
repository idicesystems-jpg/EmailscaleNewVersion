import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = 'super_admin' | 'admin' | 'admin_editor' | 'admin_viewer' | null;

export const useAdminRole = () => {
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAdminRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'admin', 'admin_editor', 'admin_viewer'])
        .order('role', { ascending: true })
        .limit(1)
        .maybeSingle();

      console.log('Admin role check:', { data, error, userId: user.id });

      if (error) {
        console.error('Error checking admin role:', error);
        setAdminRole(null);
      } else if (data) {
        console.log('Setting admin role to:', data.role);
        setAdminRole(data.role as AdminRole);
      } else {
        console.log('No admin role found for user');
        setAdminRole(null);
      }
    } catch (error) {
      console.error('Error in checkAdminRole:', error);
      setAdminRole(null);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = adminRole === 'super_admin' || adminRole === 'admin' || adminRole === 'admin_editor';
  const canDelete = adminRole === 'super_admin' || adminRole === 'admin';
  const canManageAdmins = adminRole === 'super_admin' || adminRole === 'admin';
  const isViewer = adminRole === 'admin_viewer';

  return { 
    adminRole, 
    loading, 
    canEdit, 
    canDelete, 
    canManageAdmins,
    isViewer,
    isAdmin: !!adminRole 
  };
};
