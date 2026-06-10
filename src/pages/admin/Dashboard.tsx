/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { AppCard } from '../../components/AppCard';
import { AppLoading } from '../../components/AppLoading';
import { registrationService } from '../../services/registrationService';
import { companyService } from '../../services/companyService';
import { boothService } from '../../services/boothService';
import { emailService } from '../../services/emailService';
import { 
  Users, 
  Building, 
  MapPin, 
  Mail, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  XCircle 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    totalRegs: 0,
    pendingRegs: 0,
    approvedRegs: 0,
    rejectedRegs: 0,
    totalCompanies: 0,
    totalBooths: 0,
    allocatedBooths: 0,
    sentEmails: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const [regsResponse, companies, boothsResponse, emails] = await Promise.all([
          registrationService.getAll(),
          companyService.getAll(),
          boothService.getAll(),
          emailService.getLogs()
        ]);

        const regs = regsResponse?.data || [];
        const booths = boothsResponse?.data || [];

        const pending = regs.filter(r => r.status === 'pending').length;
        const approved = regs.filter(r => r.status === 'approved').length;
        const rejected = regs.filter(r => r.status === 'rejected').length;
        const allocated = booths.filter(b => b.status === 'reserved' || b.status === 'occupied').length;

        setStats({
          totalRegs: regs.length,
          pendingRegs: pending,
          approvedRegs: approved,
          rejectedRegs: rejected,
          totalCompanies: companies.length,
          totalBooths: booths.length,
          allocatedBooths: allocated,
          sentEmails: emails.length
        });
      } catch (err) {
        console.error('Failed to load board stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardData();
  }, []);

  if (isLoading) return <AppLoading />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('menu.dashboard')} 
        description={t('admin.dashboard_desc')} 
      />

      {/* ================= STATS BENTO GRIDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <AppCard className="relative overflow-hidden group hover:shadow-xs transition-shadow">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-bu-blue" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Total Registrations</span>
              <span className="block text-3xl font-black text-gray-900">{stats.totalRegs}</span>
            </div>
            <div className="p-3 bg-bu-blue/10 text-bu-blue rounded-xl">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span className="inline-flex items-center gap-1 text-bu-success font-semibold">
              <CheckCircle size={12} /> {stats.approvedRegs} Approved
            </span>
            <span className="inline-flex items-center gap-1 text-bu-warning font-semibold">
              <Clock size={12} /> {stats.pendingRegs} Pending
            </span>
          </div>
        </AppCard>

        <AppCard className="relative overflow-hidden group hover:shadow-xs transition-shadow">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-bu-bright" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Approved Partners</span>
              <span className="block text-3xl font-black text-gray-900">{stats.totalCompanies}</span>
            </div>
            <div className="p-3 bg-bu-bright/10 text-bu-bright rounded-xl">
              <Building size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span className="font-semibold text-gray-700">Participating Corporate list</span>
          </div>
        </AppCard>

        <AppCard className="relative overflow-hidden group hover:shadow-xs transition-shadow">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-bu-success" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Booth Allocations</span>
              <span className="block text-3xl font-black text-gray-900">
                {stats.allocatedBooths} <span className="text-sm font-normal text-gray-400">/ {stats.totalBooths}</span>
              </span>
            </div>
            <div className="p-3 bg-bu-success/10 text-bu-success rounded-xl">
              <MapPin size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span className="font-semibold text-gray-700">
              {stats.totalBooths - stats.allocatedBooths} layout spaces remaining
            </span>
          </div>
        </AppCard>

        <AppCard className="relative overflow-hidden group hover:shadow-xs transition-shadow">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Notified Campaigns</span>
              <span className="block text-3xl font-black text-gray-900">{stats.sentEmails}</span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Mail size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span className="font-semibold text-gray-700">Automated triggers logs</span>
          </div>
        </AppCard>

      </div>

      {/* ================= MORE DETAILS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppCard 
          title="Registration Status Flow" 
          subtitle="Real-time request conversions"
        >
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-650 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-bu-success"></span>Approved</span>
                <span className="font-extrabold text-gray-800">{stats.approvedRegs} / {stats.totalRegs} ({stats.totalRegs ? Math.round((stats.approvedRegs/stats.totalRegs)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-bu-success h-full transition-all duration-300" 
                  style={{ width: `${stats.totalRegs ? (stats.approvedRegs/stats.totalRegs)*100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-650 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-bu-warning"></span>Pending Review</span>
                <span className="font-extrabold text-gray-800">{stats.pendingRegs} / {stats.totalRegs} ({stats.totalRegs ? Math.round((stats.pendingRegs/stats.totalRegs)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-bu-warning h-full transition-all duration-300" 
                  style={{ width: `${stats.totalRegs ? (stats.pendingRegs/stats.totalRegs)*100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-650 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-bu-danger"></span>Rejected</span>
                <span className="font-extrabold text-gray-800">{stats.rejectedRegs} / {stats.totalRegs} ({stats.totalRegs ? Math.round((stats.rejectedRegs/stats.totalRegs)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-bu-danger h-full transition-all duration-300" 
                  style={{ width: `${stats.totalRegs ? (stats.rejectedRegs/stats.totalRegs)*100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard 
          title="Quick Guides" 
          subtitle="System setup & details parameters"
        >
          <div className="text-xs text-gray-500 space-y-4">
            <p className="leading-relaxed">
              Welcome to the Bangkok University Job Fair Consolidated Dashboard. This admin control panel links all core service modules together natively.
            </p>
            <div className="p-3 bg-bu-slate/40 border border-gray-100 rounded-lg">
              <h5 className="font-bold text-gray-800 mb-1">Developer Milestone Note</h5>
              <p className="leading-relaxed">
                Navigation links inside the sidebar let you visit all other placeholders. When you run Firebase commands inside AI Studio, these modules dynamically load live data from your Firestore database seamlessly!
              </p>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  );
};
export default Dashboard;
