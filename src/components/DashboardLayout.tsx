'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Menu,
  Home,
  Calendar,
  FileText,
  Users,
  Bell,
  BookOpen,
  Settings,
  BarChart3
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase, getUserProfile, getUserRole } from '@/lib/supabase';

type SidebarItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
};

const sidebarItems: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
    roles: ['admin', 'parent', 'professor', 'orientation'],
  },
  {
    name: 'Calendar',
    href: '/dashboard/calendar',
    icon: <Calendar className="h-5 w-5" />,
    roles: ['admin', 'parent', 'professor', 'orientation'],
  },
  {
    name: 'Notifications',
    href: '/dashboard/notifications',
    icon: <Bell className="h-5 w-5" />,
    roles: ['admin', 'parent', 'professor', 'orientation'],
  },
  {
    name: 'Classes',
    href: '/dashboard/classes',
    icon: <BookOpen className="h-5 w-5" />,
    roles: ['admin', 'professor'],
  },
  {
    name: 'Grades',
    href: '/dashboard/grades',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['professor', 'parent', 'orientation'],
  },
  {
    name: 'Students',
    href: '/dashboard/students',
    icon: <Users className="h-5 w-5" />,
    roles: ['admin', 'professor', 'orientation'],
  },
  {
    name: 'Documents',
    href: '/dashboard/documents',
    icon: <FileText className="h-5 w-5" />,
    roles: ['admin', 'parent', 'professor', 'orientation'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin', 'parent', 'professor', 'orientation'],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUserData = async () => {
      // Check if user is authenticated
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      // Get user role and profile
      const userId = session.user.id;
      const role = await getUserRole(userId);
      const profile = await getUserProfile(userId);
      
      setUser(profile);
      setUserRole(role);
    };
    
    fetchUserData();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/auth/login');
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (!user || !userRole) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const filteredSidebarItems = sidebarItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside 
        className={`bg-gray-900 text-white h-full hidden md:flex flex-col transition-all ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          {!collapsed && <span className="font-bold text-xl">EL YASSIR EDU</span>}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)} 
            className="text-white hover:bg-gray-800"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {filteredSidebarItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.href ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className={`flex ${collapsed ? 'justify-center' : 'items-center space-x-3'}`}>
            {!collapsed && (
              <>
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gray-700">
                    {user.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate capitalize">
                    {userRole}
                  </p>
                </div>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut} 
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <div className="md:hidden flex items-center h-16 px-4 border-b">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <span className="font-bold text-xl ml-4">EL YASSIR EDU</span>
        </div>
        <SheetContent side="left" className="w-64 p-0">
          <div className="bg-gray-900 text-white h-full flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <span className="font-bold text-xl">EL YASSIR EDU</span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-2">
                {filteredSidebarItems.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === item.href ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gray-700">
                    {user.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate capitalize">
                    {userRole}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut} 
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow h-16 flex items-center md:justify-end px-4 md:px-6 border-b">
          <div className="flex items-center space-x-4">
            <NotificationBell userId={user.id} />
            <div className="md:hidden">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className="bg-gray-200">
                  {user.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
