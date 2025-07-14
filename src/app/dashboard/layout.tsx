import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserById } from '@/lib/data';
import { User } from '@/lib/definitions';
import { UserProvider } from '@/context/UserContext';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get('session_user_id')?.value;

  if (!sessionUserId) {
    redirect('/auth/login');
  }

  const user = getUserById(sessionUserId);

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <UserProvider user={user}>
      <DashboardLayout user={user}>{children}</DashboardLayout>
    </UserProvider>
  );
}
