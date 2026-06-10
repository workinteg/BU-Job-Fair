/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { AppCard } from '../../components/AppCard';
import { AppTable } from '../../components/AppTable';
import { AppBadge } from '../../components/AppBadge';
import { AppInput } from '../../components/AppInput';
import { AppLoading } from '../../components/AppLoading';
import { AppEmptyState } from '../../components/AppEmptyState';
import { registrationService } from '../../services/registrationService';
import { Registration } from '../../types';
import { Search, Filter, ExternalLink, Calendar } from 'lucide-react';

export const Registrations: React.FC = () => {
  const { t, language } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const loadRegs = async () => {
      try {
        const list = await registrationService.getAll();
        setRegs(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadRegs();
  }, []);

  const filteredRegs = regs.filter((r) => {
    const matchSearch = 
      r.companyNameTH.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.companyNameEN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = selectedStatus === 'all' || r.status === selectedStatus;

    return matchSearch && matchStatus;
  });

  const getStatusBadgeVariant = (status: Registration['status']) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'primary';
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (row: Registration) => <span className="font-mono text-xs text-gray-400">{row.id}</span>
    },
    {
      key: 'company',
      header: language === 'th' ? 'ชื่อบริษัท / ข้อมูลสปอนเซอร์' : 'Corporate Partner Profile',
      render: (row: Registration) => (
        <div className="space-y-0.5">
          <span className="block font-bold text-gray-900 text-sm">
            {language === 'th' ? row.companyNameTH : row.companyNameEN}
          </span>
          <span className="block text-[10px] text-gray-400">
            {language === 'th' ? row.companyNameEN : row.companyNameTH}
          </span>
        </div>
      )
    },
    {
      key: 'contact',
      header: language === 'th' ? 'ผู้ประสานงานลิสต์' : 'Representative Coordinator',
      render: (row: Registration) => (
        <div className="text-xs space-y-0.5">
          <span className="block font-medium text-gray-700">{row.coordinatorName || (row as any).contactPerson}</span>
          <span className="block text-gray-400 font-mono text-[10px]">{row.email} | {row.phone}</span>
        </div>
      )
    },
    {
      key: 'date',
      header: t('registered_date'),
      render: (row: Registration) => {
        const val = row.submittedAt || (row as any).registeredAt;
        const d = val instanceof Date 
          ? val 
          : (val && typeof (val as any).toDate === 'function' 
              ? (val as any).toDate() 
              : new Date(val as any));
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Calendar size={13} className="text-gray-400" />
            {d instanceof Date && !isNaN(d.getTime()) ? d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'N/A'}
          </span>
        );
      }
    },
    {
      key: 'status',
      header: t('status'),
      render: (row: Registration) => (
        <AppBadge 
          label={row.status.toUpperCase()} 
          variant={getStatusBadgeVariant(row.status)} 
        />
      )
    }
  ];

  if (loading) return <AppLoading />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('menu.registrations')} 
        description={t('admin.registrations_desc')} 
      />

      {/* ================= CONTROLS & SEARCH BAR ================= */}
      <AppCard className="p-4" noPadding>
        <div className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <AppInput 
              placeholder="Search companies, contact persons, or emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-full md:w-48 flex items-center gap-2">
            <Filter size={16} className="text-gray-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 text-sm py-2 px-3 bg-white focus:border-bu-blue focus:ring-1 focus:ring-bu-blue outline-hidden cursor-pointer shadow-2xs font-semibold text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </AppCard>

      {/* ================= REGISTERED APPLICANTS GRID ================= */}
      <AppTable 
        columns={columns} 
        data={filteredRegs} 
        keyExtractor={(row) => row.id}
        emptyState={<AppEmptyState />}
      />
    </div>
  );
};
export default Registrations;
