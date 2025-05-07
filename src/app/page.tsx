'use client'; // Need client-side hooks for auth check and redirect

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // User is logged in, redirect to the dashboard
        router.replace('/dashboard');
      } else {
        // User is not logged in, redirect to login
        router.replace('/auth/login');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Render minimal content while redirecting
  return (
    <div className="flex justify-center items-center h-screen">
      Loading...
    </div>
  );
}
