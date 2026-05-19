
import { supabase } from './client';
import { Database } from './types'; // Make sure to import the Database type

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  department_id?: string;
  is_super_admin: boolean;
  created_at: string;
}

export const fetchAdminUsers = async () => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*');
  
  if (error) {
    throw error;
  }
  
  return data as AdminUser[];
};

export const fetchAdminUser = async (id: string) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as AdminUser;
};

export const createAdminUser = async (adminUser: Omit<AdminUser, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('admin_users')
    .insert(adminUser)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as AdminUser;
};

export const updateAdminUser = async (id: string, updates: Partial<Omit<AdminUser, 'id' | 'created_at'>>) => {
  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as AdminUser;
};

export const deleteAdminUser = async (id: string) => {
  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
  
  return true;
};
