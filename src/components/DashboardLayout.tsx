'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon,
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
  BarChart3,
  Briefcase, // For Councils / Orientation Supervisor
  ClipboardList, // For Timetables / Questionnaires
  Award, // For Certificates / PDF Decisions
  UserCog, // For User Management / Admin role
  ShieldCheck, // For Parent: Teacher Issues, Exemptions
  DollarSign, // For Parent: Payments
  Edit3, // For Professor: Grade Entry
  MessageSquare, // For Parent: Q&A, Professor: Send Notifications
  FilePlus // For Parent: Scan Uploads
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getData } from '@/lib/data';
import { User } from '@/lib/utils';

type SidebarItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  subItems?: SidebarItem[];
  isHeader?: boolean; // To denote a category header
};

const allSidebarItems: SidebarItem[] = [
  // --- COMMON ITEMS ---
  { name: 'Dashboard Home', href: '/dashboard', icon: <Home className="h-5 w-5" />, roles: ['admin', 'parent', 'professor', 'orientation'] },
  // Removing generic Calendar, Notifications, Documents links as per feedback.
  // Functionality will be within role-specific pages or components like NotificationBell.
  
  // --- ADMINISTRATION ---
  { name: 'ADMINISTRATION', href: '#', icon: <UserCog className="h-5 w-5" />, roles: ['admin'], isHeader: true },
  { name: 'Admin Overview', href: '/dashboard/administration', icon: <Home className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Absence Management', href: '/dashboard/administration/absences', icon: <Bell className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Timetables & Schedules', href: '/dashboard/administration/timetables', icon: <ClipboardList className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Meetings & Calls', href: '/dashboard/administration/meetings', icon: <Calendar className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Certification Requests', href: '/dashboard/administration/certificates', icon: <Award className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Council Management', href: '/dashboard/administration/councils', icon: <Briefcase className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'User Management', href: '/dashboard/administration/users', icon: <Users className="h-4 w-4 ml-2" />, roles: ['admin'] },
  { name: 'Class Management', href: '/dashboard/administration/classes', icon: <BookOpen className="h-4 w-4 ml-2" />, roles: ['admin'] }, // Moved under admin

  // --- PARENTS ---
  { name: 'PARENT TOOLS', href: '#', icon: <Users className="h-5 w-5" />, roles: ['parent'], isHeader: true },
  { name: 'Parent Overview', href: '/dashboard/parent', icon: <Home className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Child Absences', href: '/dashboard/parent/absences', icon: <Bell className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Grades & Bulletins', href: '/dashboard/parent/grades', icon: <BarChart3 className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Exam Correction Uploads', href: '/dashboard/parent/corrections', icon: <FilePlus className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Payment Deadlines', href: '/dashboard/parent/payments', icon: <DollarSign className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Medical & Vaccinations', href: '/dashboard/parent/medical', icon: <FileText className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Orientation Updates', href: '/dashboard/parent/orientation', icon: <Briefcase className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Report Teacher Issue', href: '/dashboard/parent/issues', icon: <MessageSquare className="h-4 w-4 ml-2" />, roles: ['parent'] },
  { name: 'Sports Exemptions', href: '/dashboard/parent/exemptions', icon: <ShieldCheck className="h-4 w-4 ml-2" />, roles: ['parent'] },

  // --- PROFESSORS ---
  { name: 'PROFESSOR TOOLS', href: '#', icon: <BookOpen className="h-5 w-5" />, roles: ['professor'], isHeader: true },
  { name: 'Professor Overview', href: '/dashboard/professor', icon: <Home className="h-4 w-4 ml-2" />, roles: ['professor'] },
  { name: 'Grade Entry & Reports', href: '/dashboard/professor/grades', icon: <Edit3 className="h-4 w-4 ml-2" />, roles: ['professor'] },
  { name: 'My Classes & Students', href: '/dashboard/professor/classes', icon: <Users className="h-4 w-4 ml-2" />, roles: ['professor'] },
  { name: 'Send Notifications', href: '/dashboard/professor/notify', icon: <MessageSquare className="h-4 w-4 ml-2" />, roles: ['professor'] },

  // --- ORIENTATION SUPERVISOR ---
  { name: 'ORIENTATION TOOLS', href: '#', icon: <Briefcase className="h-5 w-5" />, roles: ['orientation'], isHeader: true },
  { name: 'Orientation Overview', href: '/dashboard/orientation', icon: <Home className="h-4 w-4 ml-2" />, roles: ['orientation'] },
  { name: 'Questionnaires', href: '/dashboard/orientation/questionnaires', icon: <ClipboardList className="h-4 w-4 ml-2" />, roles: ['orientation'] },
  { name: 'Decision PDFs', href: '/dashboard/orientation/decisions', icon: <Award className="h-4 w-4 ml-2" />, roles: ['orientation'] },
  { name: 'Convocations', href: '/dashboard/orientation/convocations', icon: <Bell className="h-4 w-4 ml-2" />, roles: ['orientation'] },
  { name: 'Grade Analysis', href: '/dashboard/orientation/analysis', icon: <BarChart3 className="h-4 w-4 ml-2" />, roles: ['orientation'] },
  { name: 'Parent Appointments', href: '/dashboard/orientation/appointments', icon: <Calendar className="h-4 w-4 ml-2" />, roles: ['orientation'] },
  { name: 'AFK Justifications', href: '/dashboard/orientation/afk', icon: <FileText className="h-4 w-4 ml-2" />, roles: ['orientation'] },
  { name: 'Admin Document Pickups', href: '/dashboard/orientation/admin-docs', icon: <FileText className="h-4 w-4 ml-2" />, roles: ['orientation'] }, // Changed path
  { name: 'Subscription Management', href: '/dashboard/orientation/subscriptions', icon: <Settings className="h-4 w-4 ml-2" />, roles: ['orientation'] },

  // --- COMMON BOTTOM ITEMS ---
  // { name: 'Shared Documents', href: '/dashboard/documents', icon: <FileText className="h-5 w-5" />, roles: ['admin', 'parent', 'professor', 'orientation'] }, // Removed
  { name: 'Account Settings', href: '/dashboard/settings', icon: <Settings className="h-5 w-5" />, roles: ['admin', 'parent', 'professor', 'orientation'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Determine role from pathname
    const path = pathname.split('/')[2]; // Get second segment after /dashboard/
    let role: 'admin' | 'professor' | 'parent' | 'orientation' = 'admin';
    
    if (path === 'professor') role = 'professor';
    else if (path === 'parent') role = 'parent';
    else if (path === 'orientation') role = 'orientation';
    
    // Get user based on determined role
    const user = getData.getUsersByRole(role)[0];
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setUser(user);
    setUserRole(user.role);

    // Initialize open sections based on current role
    const initialOpenState: Record<string, boolean> = {};
    if (role === 'admin') initialOpenState['ADMINISTRATION'] = true;
    if (role === 'parent') initialOpenState['PARENT TOOLS'] = true;
    if (role === 'professor') initialOpenState['PROFESSOR TOOLS'] = true;
    if (role === 'orientation') initialOpenState['ORIENTATION TOOLS'] = true;
    setOpenSections(initialOpenState);
  }, [pathname, router]);

  const handleSignOut = () => {
    setUser(null);
    setUserRole(null);
    router.push('/auth/login');
  };

  if (!user || !userRole) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Filter sidebar items based on user role
  const filteredSidebarItems = allSidebarItems.filter(item => item.roles.includes(userRole));

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const renderSidebarItem = (item: SidebarItem, isSubItem = false) => {
    if (item.isHeader) {
      return (
        <button
          key={item.name}
          onClick={() => item.subItems && toggleSection(item.name)}
          className={`w-full flex items-center px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-opacity-80 hover:bg-blue-900 rounded-md ${collapsed ? 'justify-center' : ''}`}
        >
          <span className={collapsed ? '' : 'mr-3'}>{item.icon}</span>
          {!collapsed && <span className="flex-1 text-left">{item.name}</span>}
          {!collapsed && item.subItems && (openSections[item.name] ? <ChevronRight className="h-4 w-4 rotate-90 transform transition-transform" /> : <ChevronRight className="h-4 w-4 transform transition-transform" />)}
        </button>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isSubItem && !collapsed ? 'pl-8' : ''} ${
          pathname === item.href ? 'bg-blue-900 bg-opacity-80 text-white' : 'text-gray-200 hover:bg-blue-900 hover:bg-opacity-60 hover:text-white'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <span className={collapsed && !isSubItem ? '' : 'mr-3'}>{item.icon}</span>
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  // --- Conditional return for loading state ---
  if (!user || !userRole) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // --- Render the layout ---
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside
        className={`text-white h-full hidden md:flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-72' // Increased width for section headers
        }`}
        style={{ backgroundColor: 'rgb(14, 46, 97)' }}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-800 h-16">
          {!collapsed && <span className="font-bold text-xl">EL YASSIR</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white hover:bg-gray-700"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {filteredSidebarItems.map((item) => (
              <div key={item.name}>
                {renderSidebarItem(item)}
                {!collapsed && item.subItems && openSections[item.name] && (
                  <div className="mt-1 space-y-1">
                    {item.subItems
                      .filter(subItem => subItem.roles.includes(userRole)) // userRole is non-null here
                      .map(subItem => renderSidebarItem(subItem, true))}
                  </div>
                )}
              </div>
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
                    {user.name.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name}
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
          <div className="text-white h-full flex flex-col" style={{ backgroundColor: 'rgb(14, 46, 97)' }}>
            <div className="p-4 border-b border-opacity-20 border-white">
              <span className="font-bold text-xl">EL YASSIR EDU</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-2">
                {filteredSidebarItems.map((item) => (
                  <div key={item.name}>
                    {renderSidebarItem(item)}
                    {item.subItems && openSections[item.name] && ( // Assuming mobile always shows subitems if section is "open" conceptually
                      <div className="mt-1 space-y-1">
                        {item.subItems
                          .filter(subItem => subItem.roles.includes(userRole)) // userRole is non-null here
                          .map(subItem => renderSidebarItem(subItem, true))}
                      </div>
                    )}
                  </div>
                ))}
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
                  <p className="text-sm font-medium text-white truncate">
                    {user.name}
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
                  {user.name.charAt(0) || 'U'}
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
