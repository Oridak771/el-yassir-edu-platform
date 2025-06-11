'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleEmailVerification = async () => {
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        // If session is refreshed successfully after verification
        router.push('/dashboard');
      } else {
        // If there's an error or the email is not verified
        router.push('/auth/login');
      }
    };

    handleEmailVerification();
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Verifying your email...</p>
    </div>
  );
}
