/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './firebase/AuthContext';
import { RouterProvider, Route, useRouter, AdminRoute, RoleRoute } from './routes/Router';

// Interfaces & Services
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public pages
import { Landing } from './pages/Landing';
import { RegisterPage } from './pages/RegisterPage';
import { SuccessPage } from './pages/SuccessPage';

// Admin auth, protection & management pages
import { Login } from './pages/admin/Login';
import { Unauthorized } from './pages/admin/Unauthorized';
import { Admins } from './pages/admin/Admins';

// Admin folders
import { Dashboard } from './pages/admin/Dashboard';
import { Registrations } from './pages/admin/Registrations';
import { Companies } from './pages/admin/Companies';
import { Categories } from './pages/admin/Categories';
import { EventDates } from './pages/admin/EventDates';
import { Booths } from './pages/admin/Booths';
import { Emails } from './pages/admin/Emails';
import { Templates } from './pages/admin/Templates';
import { HomepageContent } from './pages/admin/HomepageContent';
import { Announcements } from './pages/admin/Announcements';
import { Settings } from './pages/admin/Settings';
import { AuditLogPage } from './pages/admin/AuditLog';
import { Health } from './pages/admin/Health';
import { SeedData } from './pages/admin/SeedData';

const AppContent: React.FC = () => {
  const { currentPath } = useRouter();

  // Render open authentication paths without the standard admin layout or gate
  if (currentPath === '/admin/login') {
    return <Login />;
  }

  if (currentPath === '/admin/unauthorized') {
    return <Unauthorized />;
  }

  const isAdminPath = currentPath.startsWith('/admin');

  if (isAdminPath) {
    return (
      <AdminRoute>
        <AdminLayout>
          <Route path="/admin" element={<Dashboard />} exact />
          <Route path="/admin/registrations" element={<Registrations />} />
          <Route path="/admin/companies" element={<Companies />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/event-dates" element={<EventDates />} />
          <Route path="/admin/booths" element={<Booths />} />
          <Route path="/admin/emails" element={<Emails />} />
          <Route path="/admin/templates" element={<Templates />} />
          <Route path="/admin/content/homepage" element={<HomepageContent />} />
          <Route path="/admin/announcements" element={<Announcements />} />
          
          {/* Super Admin Restricted Control Panels */}
          <Route path="/admin/settings" element={
            <RoleRoute permission="settings">
              <Settings />
            </RoleRoute>
          } />
          <Route path="/admin/audit-log" element={
            <RoleRoute permission="audit-log">
              <AuditLogPage />
            </RoleRoute>
          } />
          <Route path="/admin/admins" element={
            <RoleRoute permission="admins">
              <Admins />
            </RoleRoute>
          } />
          <Route path="/admin/system/health" element={
            <RoleRoute permission="superAdmin">
              <Health />
            </RoleRoute>
          } />
          <Route path="/admin/system/seed" element={
            <RoleRoute permission="superAdmin">
              <SeedData />
            </RoleRoute>
          } />
        </AdminLayout>
      </AdminRoute>
    );
  }

  return (
    <PublicLayout>
      <Route path="/" element={<Landing />} exact />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/success" element={<SuccessPage />} />
    </PublicLayout>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

