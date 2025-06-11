'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, getUserProfile } from '@/lib/supabase'; // Uncommented
import { Switch } from '@/components/ui/switch'; // Uncommented
import { Label } from '@/components/ui/label'; // Uncommented
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { User } from '@supabase/supabase-js';

type UserProfileInfo = {
    id: string;
    full_name: string;
    email: string;
    role: string;
};

type NotificationPreference = {
    user_id: string;
    notification_type: string;
    is_subscribed: boolean;
    // channel?: string; // For future use
};

// Combined type for display
type UserSubscriptionDisplay = UserProfileInfo & {
    subscriptions: Record<string, boolean>; // e.g., { 'orientation_updates': true, 'new_questionnaire_alert': false }
};

// Define the notification types an Orientation Supervisor might manage
const ORIENTATION_NOTIFICATION_TYPES = [
    { key: 'orientation_general_updates', label: 'General Orientation Updates' },
    { key: 'new_questionnaire_alert', label: 'New Questionnaire Alerts' },
    { key: 'appointment_confirmations', label: 'Appointment Confirmations' },
    { key: 'decision_notifications', label: 'Decision Availability Alerts' },
];

export default function OrientationSubscriptionsPage() {
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscriptionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'parent'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchUserSubscriptions = useCallback(async () => {
    setLoading(true);

    // 1. Fetch users (students and parents)
    let usersQuery = supabase.from('users').select('id, full_name, email, role');
    if (filterRole !== 'all') {
        usersQuery = usersQuery.eq('role', filterRole);
    }
    if (searchTerm) {
        // Basic search on name or email
        usersQuery = usersQuery.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }
    const { data: usersData, error: usersError } = await usersQuery.order('full_name').limit(100); // Add limit

    if (usersError) {
        console.error("Error fetching users:", usersError);
        setUserSubscriptions([]);
        setLoading(false);
        return;
    }
    if (!usersData) {
        setUserSubscriptions([]);
        setLoading(false);
        return;
    }

    // 2. Fetch all relevant notification preferences
    const userIds = usersData.map(u => u.id);
    const notificationTypeKeys = ORIENTATION_NOTIFICATION_TYPES.map(t => t.key);
    let allPreferences: NotificationPreference[] = [];

    if (userIds.length > 0 && notificationTypeKeys.length > 0) {
        const { data: prefsData, error: prefsError } = await supabase
            .from('user_notification_preferences')
            .select('user_id, notification_type, is_subscribed')
            .in('user_id', userIds)
            .in('notification_type', notificationTypeKeys);

        if (prefsError) console.error("Error fetching preferences:", prefsError);
        else allPreferences = prefsData || [];
    }

    // 3. Combine data
    const combinedData = usersData.map(user => {
        const subscriptions: Record<string, boolean> = {};
        ORIENTATION_NOTIFICATION_TYPES.forEach(type => {
            const pref = allPreferences.find(p => p.user_id === user.id && p.notification_type === type.key);
            subscriptions[type.key] = pref ? pref.is_subscribed : true; // Default to subscribed if no preference found
        });
        return { ...user, subscriptions };
    });

    setUserSubscriptions(combinedData);
    setLoading(false);
  }, [filterRole, searchTerm]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setCurrentUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session }}) => {
        setCurrentUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);


  useEffect(() => {
    if(currentUser) { // Only fetch if user is loaded (though RLS handles access)
        fetchUserSubscriptions();
    }
  }, [currentUser, fetchUserSubscriptions]);


  const handleToggleSubscription = async (userId: string, notificationType: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Upsert the preference
    const { error } = await supabase
        .from('user_notification_preferences')
        .upsert(
            { user_id: userId, notification_type: notificationType, is_subscribed: newStatus, channel: 'in_app' },
            { onConflict: 'user_id, notification_type, channel' }
        );

    if (error) {
        console.error("Error updating subscription:", error);
        alert(`Failed to update subscription: ${error.message}`);
    } else {
        // Optimistically update UI or re-fetch
        setUserSubscriptions(prev => prev.map(user =>
            user.id === userId
            ? { ...user, subscriptions: { ...user.subscriptions, [notificationType]: newStatus } }
            : user
        ));
        // Or call fetchUserSubscriptions(); for a full refresh
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Notification Subscription Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Manage User Subscriptions for Orientation Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
            <Select value={filterRole} onValueChange={val => setFilterRole(val as any)}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="parent">Parents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading && <p>Loading user subscriptions...</p>}
          {!loading && userSubscriptions.length === 0 && <p>No users found matching criteria or no relevant notification types defined.</p>}
          {!loading && userSubscriptions.length > 0 && (
            <div className="overflow-x-auto">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell>User</TableHeaderCell>
                            <TableHeaderCell>Email</TableHeaderCell>
                            <TableHeaderCell>Role</TableHeaderCell>
                            {ORIENTATION_NOTIFICATION_TYPES.map(type => (
                                <TableHeaderCell key={type.key} className="text-center">{type.label}</TableHeaderCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {userSubscriptions.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>{user.full_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className="capitalize">{user.role}</TableCell>
                                {ORIENTATION_NOTIFICATION_TYPES.map(type => (
                                    <TableCell key={type.key} className="text-center">
                                        <Switch
                                            id={`sub-${user.id}-${type.key}`}
                                            checked={user.subscriptions[type.key]}
                                            onCheckedChange={() => handleToggleSubscription(user.id, type.key, user.subscriptions[type.key])}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}