import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the login page by default.
  // The middleware will handle redirecting to the dashboard if a session exists.
  redirect('/auth/login');
}
