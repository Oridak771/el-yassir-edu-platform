'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/data';
import { User } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await auth.getSession();
        const user = session?.user;
        if (!user) {
          router.push('/auth/login');
          return;
        }

        setUser(user);

        // Redirect based on role
        switch (user.role) {
          case 'admin':
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
            setError(`Unknown user role: ${user.role}`);
            router.push('/auth/login');
            break;
        }
      } catch (err) {
        setError('Error fetching user session');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we load your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Redirecting...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Taking you to your dashboard...</p>
        </CardContent>
      </Card>
    </div>
  );
}
