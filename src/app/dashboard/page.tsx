'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Define a type for the user profile data
interface UserProfile {
  id: string;
  role: 'administration' | 'parent' | 'professor' | 'orientation';
  full_name?: string;
  // Add other profile fields if needed
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      setError(null);

      // 1. Get the current session and user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError('Error fetching session: ' + sessionError.message);
        setLoading(false);
        router.push('/auth/login'); // Redirect to login if session error
        return;
      }

      if (!session?.user) {
        // No user logged in
        router.push('/auth/login');
        setLoading(false);
        return;
      }

      setUser(session.user);

      // 2. Fetch the user's profile from the 'users' table using their ID
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, role, full_name') // Select necessary fields
        .eq('id', session.user.id)
        .single(); // Expecting only one profile per user ID

      if (profileError) {
        setError('Error fetching user profile: ' + profileError.message);
        console.error('Profile fetch error:', profileError);
        // Handle cases where profile might not exist yet, maybe redirect to a setup page or show error
        setLoading(false);
        // Decide where to redirect if profile fetch fails (e.g., logout, error page)
        // For now, let's keep them here but show an error
        return;
      }

      if (profileData) {
        setProfile(profileData as UserProfile);
        // 3. Redirect based on role
        switch (profileData.role) {
          case 'administration':
            router.replace('/dashboard/administration');
            break;
          case 'parent':
            router.replace('/dashboard/parent');
            break;
          case 'professor':
            router.replace('/dashboard/professor');
            break;
          case 'orientation':
            router.replace('/dashboard/orientation');
            break;
          default:
            // Handle unknown role - maybe redirect to login or a default page
            setError(`Unknown user role: ${profileData.role}`);
            // Consider logging out or redirecting to login
             await supabase.auth.signOut();
             router.push('/auth/login');
            break;
        }
      } else {
          setError('User profile not found.');
          // Handle profile not found case
          await supabase.auth.signOut();
          router.push('/auth/login');
      }

      setLoading(false);
    };

    fetchUserAndProfile();
  }, [router]);

  // Display loading state or error message while fetching/redirecting
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }

  // This part should ideally not be reached if redirection works correctly
  return (
    <div className="flex justify-center items-center h-screen">
      Redirecting to your dashboard...
    </div>
  );
}
