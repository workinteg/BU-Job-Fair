/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { AppCard } from '../../components/AppCard';
import { AppTable } from '../../components/AppTable';
import { AppLoading } from '../../components/AppLoading';
import { AppEmptyState } from '../../components/AppEmptyState';
import { auditLogService } from '../../services/auditLogService';
import { AuditLog } from '../../types';
import { ShieldAlert, User, Terminal, Clock } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { t, language } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const list = await auditLogService.getAll();
        setLogs(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const columns = [
    {
      key: 'timestamp',
      header: 'Event Timestamp',
      render: (row: AuditLog) => {
        const d = row.timestamp instanceof Date 
          ? row.timestamp 
          : (row.timestamp && typeof (row.timestamp as any).toDate === 'function' 
              ? (row.timestamp as any).toDate() 
              : new Date(row.timestamp as any));
        const formatted = d instanceof Date && !isNaN(d.getTime()) 
          ? d.toISOString().replace('T', ' ').substring(0, 19) 
          : 'N/A';
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-500 font-semibold">
            <Clock size={13} className="text-gray-400" />
            {formatted}
          </span>
        );
      }
    },
    {
      key: 'user',
      header: 'Acting Operator',
      render: (row: AuditLog) => (
        <span className="font-bold text-gray-900 text-xs inline-flex items-center gap-1.5 bg-gray-100/50 px-2.5 py-1 rounded-md">
          <User size={12} className="text-bu-blue" />
          {row.userEmail || (row as any).user || 'system'}
        </span>
      )
    },
    {
      key: 'action',
      header: 'Action Event',
      render: (row: AuditLog) => (
        <span className="font-mono text-[10px] font-black tracking-wider uppercase text-bu-bright bg-blue-50/50 border border-blue-105/40 px-2 py-0.5 rounded-sm">
          {row.action}
        </span>
      )
    },
    {
      key: 'details',
      header: 'Operation Details Summary',
      render: (row: AuditLog) => <p className="text-xs text-gray-650 max-w-sm truncate font-medium" title={row.details}>{row.details}</p>
    }
  ];

  if (loading) return <AppLoading />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('menu.audit_log')} 
        description={t('admin.audit_log_desc')} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <AppTable 
            columns={columns} 
            data={logs} 
            keyExtractor={(row) => row.id}
            emptyState={<AppEmptyState />}
          />
        </div>

        <div>
          <AppCard title="Traceability Guidelines" className="h-full">
            <div className="text-xs text-gray-500 space-y-4">
              <div className="p-3 bg-bu-slate rounded-lg border border-gray-150 flex flex-col gap-2">
                <span className="font-bold text-gray-700 flex items-center gap-1">
                  <Terminal size={14} className="text-bu-blue" /> Trace Logger Policy
                </span>
                <span className="leading-relaxed block">
                  To safeguard legal compliance, all operations (including settings swaps, approving corporate applications, and booth assignments modifications) log permanently inside the Firestore audit collections.
                </span>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  );
};
export default AuditLogPage;
