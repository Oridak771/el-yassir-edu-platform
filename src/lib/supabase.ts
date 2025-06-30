import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data?.role || null;
  } catch (error: any) {
    console.error('Error getting user role (raw):', error);
    console.error('Error getting user role (stringified):', JSON.stringify(error, null, 2));
    console.error('Error message for getUserRole:', error?.message);
    console.error('Error code for getUserRole:', error?.code);
    console.error('Error details for getUserRole:', error?.details);
    console.error('Error hint for getUserRole:', error?.hint);
    return null;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error getting user profile (raw):', error);
    console.error('Error getting user profile (stringified):', JSON.stringify(error, null, 2));
    console.error('Error message for getUserProfile:', error?.message);
    console.error('Error code for getUserProfile:', error?.code);
    console.error('Error details for getUserProfile:', error?.details);
    console.error('Error hint for getUserProfile:', error?.hint);
    return null;
  }
}

export async function getNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function subscribeToNotifications(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe();
}
