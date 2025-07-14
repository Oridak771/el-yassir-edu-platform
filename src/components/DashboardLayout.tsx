'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
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
  BarChart3,
  Briefcase,
  ClipboardList,
  Award,
  UserCog,
  DollarSign,
  Edit3,
  MessageSquare,
  FilePlus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { auth } from '@/lib/data';
import { User } from '@/lib/definitions'; 

type SidebarItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  subItems?: SidebarItem[];
  isHeader?: boolean;
};

const allSidebarItems: SidebarItem[] = [
  { name: 'Dashboard Home', href: '/dashboard', icon: <Home className="h-5 w-5" />, roles: ['admin', 'parent', 'professor', 'orientation'] },
  { name: 'ADMINISTRATION', href: '#', icon: <UserCog className="h-5 w-5" />, roles: ['admin'], isHeader: true },
  { name: 'Admin Overview', href: '/dashboard/administration', icon: <Home className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Absence Management', href: '/dashboard/administration/absences', icon: <Bell className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Timetables & Schedules', href: '/dashboard/administration/timetables', icon: <ClipboardList className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Meetings & Calls', href: '/dashboard/administration/meetings', icon: <Calendar className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Certification Requests', href: '/dashboard/administration/certificates', icon: <Award className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Council Management', href: '/dashboard/administration/councils', icon: <Briefcase className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'User Management', href: '/dashboard/administration/users', icon: <Users className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Class Management', href: '/dashboard/administration/classes', icon: <BookOpen className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'PARENT TOOLS', href: '#', icon: <Users className="h-5 w-5" />, roles: ['parent'], isHeader: true },
  { name: 'Parent Overview', href: '/dashboard/parent', icon: <Home className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Child Absences', href: '/dashboard/parent/absences', icon: <Bell className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Grades & Bulletins', href: '/dashboard/parent/grades', icon: <BarChart3 className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Exam Correction Uploads', href: '/dashboard/parent/corrections', icon: <FilePlus className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Payment Deadlines', href: '/dashboard/parent/payments', icon: <DollarSign className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Medical & Vaccinations', href: '/dashboard/parent/medical', icon: <FileText className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Orientation Updates', href: '/dashboard/parent/orientation', icon: <Briefcase className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'PROFESSOR TOOLS', href: '#', icon: <UserCog className="h-5 w-5" />, roles: ['professor'], isHeader: true },
  { name: 'Professor Overview', href: '/dashboard/professor', icon: <Home className="h-4 w-4 ml-2" />, roles: ['professor'] },
  { name: 'Grade Entry', href: '/dashboard/professor/grades', icon: <Edit3 className="h-4 w-4 ml-2" />, roles: ['professor'] },
  { name: 'Absence Tracking', href: '/dashboard/professor/absences', icon: <Bell className="h-4 w-4 ml-2" />, roles: ['professor'] },
  { name: 'Send Notifications', href: '/dashboard/professor/notifications', icon: <MessageSquare className="h-4 w-4 ml-2" />, roles: ['professor'] },
  { name: 'ORIENTATION TOOLS', href: '#', icon: <Briefcase className="h-5 w-5" />, roles: ['orientation'], isHeader: true },
  { name: 'Orientation Overview', href: '/dashboard/orientation', icon: <Home className="h-4 w-4 ml-2" />, roles: ['orientation'] },
  { name: 'Student Files', href: '/dashboard/orientation/students', icon: <FileText className="h-4 w-4 ml-2" />, roles: ['orientation'] },
  { name: 'Parent Meetings', href: '/dashboard/orientation/meetings', icon: <Users className="h-4 w-4 ml-2" />, roles: ['orientation'] },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = '/auth/login'; 
  };

  const userRole = user.role;

  const toggleSection = (name: string) => {
    setOpenSections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const renderSidebarItem = (item: SidebarItem, isSubItem = false) => {
    const isActive = pathname === item.href;

    if (item.isHeader) {
      return (
        <div
          className={`px-3 py-2 text-xs font-semibold uppercase text-gray-400 tracking-wider ${collapsed ? 'text-center' : ''}`}
        >
          {collapsed ? item.icon : item.name}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`flex items-center p-2 text-gray-300 rounded-lg hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''} ${isSubItem ? 'pl-8' : ''}`}
      >
        {item.icon}
        {!collapsed && <span className="ml-3">{item.name}</span>}
      </Link>
    );
  };

  const filteredSidebarItems = allSidebarItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside
        className={`text-white h-full hidden md:flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-72'}`}
        style={{ backgroundColor: 'rgb(14, 46, 97)' }}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-800 h-16">
          {!collapsed && <span className="font-bold text-xl">EL YASSIR</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {filteredSidebarItems.map((item) => renderSidebarItem(item))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className={`flex ${collapsed ? 'justify-center' : 'items-center space-x-3'}`}>
            {!collapsed && (
              <>
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gray-700">
                    {user.name.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate capitalize">{userRole}</p>
                </div>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <div className="md:hidden flex items-center justify-between h-16 px-4 border-b bg-white">
          <span className="font-bold text-xl">EL YASSIR EDU</span>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="w-72 p-0">
          <div className="text-white h-full flex flex-col" style={{ backgroundColor: 'rgb(14, 46, 97)' }}>
            <div className="p-4 border-b border-opacity-20 border-white">
              <span className="font-bold text-xl">EL YASSIR EDU</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-2">
                {filteredSidebarItems.map((item) => renderSidebarItem(item))}
              </nav>
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gray-700">
                    {user.name.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate capitalize">{userRole}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
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
        <header className="bg-white shadow h-16 flex items-center justify-end px-4 md:px-6 border-b">
          <div className="flex items-center space-x-4">
            <NotificationBell userId={user.id} />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
