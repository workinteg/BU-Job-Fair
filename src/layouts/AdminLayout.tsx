/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { useRouter } from '../routes/Router';
import { useAuth } from '../firebase/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { isFirebaseConfigured } from '../firebase/firebase';
import { 
  LayoutDashboard, 
  FileCheck, 
  Building2, 
  Tag, 
  Calendar, 
  MapPin, 
  Mail, 
  FileCode, 
  Settings, 
  ShieldAlert,
  Menu,
  X,
  Globe,
  User,
  Users,
  LogOut,
  AlertTriangle,
  Activity,
  Database,
  Megaphone,
  Home
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t, language } = useTranslation();
  const { navigate, currentPath, isActive } = useRouter();
  const { user, role, logout, hasPermission } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const menuItems = [
    { path: '/admin', exact: true, label: t('menu.dashboard'), icon: LayoutDashboard },
    { path: '/admin/registrations', exact: false, label: t('menu.registrations'), icon: FileCheck },
    { 
      path: '/admin/companies', 
      exact: false, 
      label: t('menu.companies'), 
      icon: Building2,
      subItems: [
        { path: '/admin/companies', label: language === 'th' ? 'รายชื่อสถานประกอบการ Master' : 'Company List' },
        { path: '/admin/companies/import', label: language === 'th' ? 'นำเข้าชุดข้อมูล CSV' : 'Import CSV' }
      ]
    },
    { 
      path: '/admin/categories', 
      exact: false, 
      label: t('menu.categories'), 
      icon: Tag,
      subItems: [
        { path: '/admin/categories', label: language === 'th' ? 'รายการหมวดหมู่' : 'Category List' },
        { path: '/admin/categories/import', label: language === 'th' ? 'นำเข้าข้อมูล CSV' : 'Import Categories' }
      ]
    },
    { path: '/admin/event-dates', exact: false, label: t('menu.event_dates'), icon: Calendar },
    { path: '/admin/booths', exact: false, label: t('menu.booths'), icon: MapPin },
    { path: '/admin/emails', exact: false, label: t('menu.emails'), icon: Mail },
    { path: '/admin/templates', exact: false, label: t('menu.templates'), icon: FileCode },
    { path: '/admin/content/homepage', exact: false, label: language === 'th' ? 'จัดการหน้าแรก CMS' : 'Homepage CMS', icon: Globe },
    { path: '/admin/announcements', exact: false, label: language === 'th' ? 'ข่าวสารและประกาศ' : 'Announcements', icon: Megaphone },
    { path: '/admin/admins', exact: false, label: language === 'th' ? 'จัดการสิทธิ์แอดมิน' : 'Admin Management', icon: Users },
    { path: '/admin/settings', exact: false, label: t('menu.settings'), icon: Settings },
    { path: '/admin/audit-log', exact: false, label: t('menu.audit_log'), icon: ShieldAlert },
    { path: '/admin/system/health', exact: false, label: language === 'th' ? 'สถานะเครื่องหลัก' : 'System Health', icon: Activity },
    { path: '/admin/system/seed', exact: false, label: language === 'th' ? 'เครื่องมือ Seeding' : 'Seed Metadata', icon: Database },
  ];

  // Dynamic filter based on RBAC rules
  const permittedMenuItems = menuItems.filter(item => {
    if (item.path === '/admin/settings') return hasPermission('settings');
    if (item.path === '/admin/audit-log') return hasPermission('audit-log');
    if (item.path === '/admin/admins') return hasPermission('admins');
    if (item.path === '/admin/system/health') return hasPermission('superAdmin');
    if (item.path === '/admin/system/seed') return hasPermission('superAdmin');
    return true;
  });

  const handleNav = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const activeEmail = user?.email || 'workinteg@bu.ac.th';
  const activeName = user?.displayName || 'Administrator';
  const displayRoleText = role === 'superAdmin' ? 'Super Admin' : 'Admin';

  const handleConfirmLogout = () => {
    if (window.confirm(language === 'th' ? 'ยืนยันเพื่อออกจากระบบสำหรับการจัดการผู้ดูแลระบบ?' : 'Are you sure you want to sign out from the admin portal?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen flex bg-bu-slate text-gray-900">
      
      {/* ================= BACKGROUND DRAWER OVERLAY (MOBILE) ================= */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR (DESKTOP & MOBILE TRANSITIONS) ================= */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-bu-blue text-white shadow-xl transition-all duration-300
          ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <div 
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-white text-bu-blue flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-all">
              BU
            </div>
            {!isSidebarCollapsed && (
              <div className="transition-opacity duration-200">
                <span className="block text-xs font-black text-white tracking-tight leading-none uppercase">
                  BU Job Fair
                </span>
                <span className="block text-[9px] text-white/60 font-semibold tracking-wider mt-1 uppercase">
                  Admin console
                </span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white/60 hover:text-white lg:hidden p-1 bg-white/10 rounded-lg cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          {!isSidebarCollapsed && (
            <div className="px-6 pb-2 text-[10px] uppercase tracking-widest text-white/45 font-bold">Main Console</div>
          )}
          {permittedMenuItems.map((item) => {
            const isLinkActive = isActive(item.path, item.exact);
            const IconComponent = item.icon;

            return (
              <div key={item.path} className="space-y-0.5 animate-fade-in">
                <button
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center gap-3 px-6 py-3 border-l-4 transition-all duration-200 cursor-pointer group ${
                    isLinkActive
                      ? 'bg-white/10 border-white text-white font-bold'
                      : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <div className={`transition-transform duration-200 group-hover:scale-110 ${isLinkActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                    <IconComponent size={18} />
                  </div>
                  {(!isSidebarCollapsed || isMobileMenuOpen) && (
                    <span className="truncate text-sm tracking-wide">{item.label}</span>
                  )}
                </button>
                {item.subItems && isLinkActive && (!isSidebarCollapsed || isMobileMenuOpen) && (
                  <div className="pl-12 pr-4 py-1.5 space-y-1 transition-all border-l border-white/15 ml-8">
                    {item.subItems.map((sub) => {
                      const isSubActive = currentPath === sub.path;
                      return (
                        <button
                          key={sub.path}
                          onClick={() => handleNav(sub.path)}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors block ${
                            isSubActive 
                              ? 'bg-white/15 text-white font-extrabold shadow-3xs' 
                              : 'text-white/60 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer / Toggle collapse */}
        <div className="p-4 border-t border-white/10 bg-black/10 space-y-2">
          {/* Quick link Back to public homepage */}
          <button
            onClick={() => handleNav('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Globe size={16} className="text-white/50" />
            {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{t('back_to_home')}</span>}
          </button>

          {/* Logout Action trigger */}
          <button
            onClick={handleConfirmLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-red-200 hover:text-white hover:bg-red-500/20 transition-all cursor-pointer"
          >
            <LogOut size={16} className="text-red-300" />
            {(!isSidebarCollapsed || isMobileMenuOpen) && <span>{language === 'th' ? 'ออกจากระบบ' : 'Sign Out'}</span>}
          </button>
          
          {/* Collapse sidebar button */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle Sidebar size"
          >
            <div className={`transform transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </div>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CANVASES AREA ================= */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        
        {/* Top Header Controls */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
          
          {/* Menu Drawer Toggle Button (Mobile) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 lg:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            
            {/* System Title breadcrumb segment */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                {t('app.title')}
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-bold text-bu-blue">
                {t('admin_dashboard')}
              </span>
            </div>
          </div>

          {/* User profile & configurations */}
          <div className="flex items-center gap-4">
            {/* Connection alert badge */}
            {!isFirebaseConfigured && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-bu-warning bg-amber-50 border border-amber-100/60 animate-pulse">
                <AlertTriangle size={12} />
                Sandbox Mode
              </span>
            )}

            {/* Selector TH/EN */}
            <LanguageSwitcher />

            {/* Profile Avatar Badge */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div 
                className="w-8 h-8 rounded-full bg-bu-blue/10 border border-bu-blue/20 flex items-center justify-center text-bu-blue text-sm font-black cursor-pointer"
                title={`${activeName} - ${displayRoleText}`}
                onClick={handleConfirmLogout}
              >
                <User size={15} />
              </div>
              <div className="hidden md:block text-left text-xs leading-none">
                <span className="block font-bold text-gray-700 mb-0.5">{activeName}</span>
                <span className="block text-[10px] text-gray-400 font-medium mb-0.5">{activeEmail}</span>
                <span className="inline-block bg-slate-100 text-slate-600 rounded px-1 text-[9px] font-bold uppercase tracking-wide">
                  {displayRoleText}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;

