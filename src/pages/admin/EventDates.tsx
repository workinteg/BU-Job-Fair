/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { AppCard } from '../../components/AppCard';
import { AppTable } from '../../components/AppTable';
import { AppBadge } from '../../components/AppBadge';
import { Calendar, AlertCircle } from 'lucide-react';

export const EventDates: React.FC = () => {
  const { t, language } = useTranslation();

  const mockMilestones = [
    {
      id: 'dt_01',
      date: '2026-06-10',
      labelTH: 'เปิดรับลงทะเบียนผู้ประกอบการ (ระยะที่ 1)',
      labelEN: 'Corporate Registrations open (Phase 1)',
      status: 'active'
    },
    {
      id: 'dt_02',
      date: '2026-07-01',
      labelTH: 'คัดกรองคุณสมบัติและส่งเมลยืนยันสิทธิ์',
      labelEN: 'Credential review & Dispatching authorizations',
      status: 'pending'
    },
    {
      id: 'dt_03',
      date: '2026-07-15',
      labelTH: 'ระยะที่ 2: ประกาศแผนผังจัดสรรตำแหน่งบูธจริง',
      labelEN: 'Phase 2: Final Layout number assignation',
      status: 'pending'
    },
    {
      id: 'dt_04',
      date: '2026-08-13',
      labelTH: 'ผู้ประกอบการเข้าเตรียมและตกแต่งสถานที่บูธ',
      labelEN: 'Merchant move-in & Exhibition space setup',
      status: 'pending'
    },
    {
      id: 'dt_05',
      date: '2026-08-14',
      labelTH: 'วันจัดงาน BU Job Fair 2026 (วันแรก)',
      labelEN: 'BU Job Fair 2026 Kickoff day (Day 1)',
      status: 'pending'
    }
  ];

  const columns = [
    {
      key: 'date',
      header: language === 'th' ? 'วันที่จัดงาน' : 'Date',
      render: (row: any) => (
        <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-gray-900 bg-gray-100/50 px-2.5 py-1 rounded-md">
          <Calendar size={13} className="text-bu-blue" />
          {row.date}
        </span>
      )
    },
    {
      key: 'label',
      header: language === 'th' ? 'รายละเอียดกิจกรรมสำคัญ' : 'Milestone Operation',
      render: (row: any) => (
        <span className="font-bold text-gray-800 text-sm">
          {language === 'th' ? row.labelTH : row.labelEN}
        </span>
      )
    },
    {
      key: 'status',
      header: t('status'),
      render: (row: any) => (
        <AppBadge 
          label={row.status.toUpperCase()} 
          variant={row.status === 'active' ? 'success' : 'secondary'} 
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('menu.event_dates')} 
        description={t('admin.event_dates_desc')} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AppTable 
            columns={columns} 
            data={mockMilestones} 
            keyExtractor={(row) => row.id}
          />
        </div>

        <div>
          <AppCard title="Milestones Policy">
            <div className="text-xs text-gray-500 space-y-4">
              <p className="leading-relaxed">
                Event dates govern active deadlines. These indicators prompt emails, lock specific public routes, and notify candidates about upcoming recruitment drives.
              </p>
              <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed block">
                  Once milestone dates lapse, the database records should automatically badge them as completed, preventing state shortcut errors.
                </span>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  );
};
export default EventDates;
