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
import { AppLoading } from '../../components/AppLoading';
import { AppEmptyState } from '../../components/AppEmptyState';
import { emailService } from '../../services/emailService';
import { EmailLog } from '../../types';
import { Mail, Clock, Send, ShieldCheck } from 'lucide-react';

export const Emails: React.FC = () => {
  const { t, language } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<EmailLog[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const list = await emailService.getLogs();
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
      key: 'id',
      header: 'Tracking ID',
      render: (row: EmailLog) => <span className="font-mono text-xs text-gray-400 font-medium">{row.id}</span>
    },
    {
      key: 'recipient',
      header: 'Recipient Email Address',
      render: (row: EmailLog) => (
        <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Mail size={14} className="text-gray-400" />
          {row.recipient}
        </span>
      )
    },
    {
      key: 'subject',
      header: 'Email Subject Title',
      render: (row: EmailLog) => <span className="font-medium text-gray-700 text-xs truncate max-w-xs block">{row.subject}</span>
    },
    {
      key: 'sentAt',
      header: 'Sent Timestamp',
      render: (row: EmailLog) => {
        const val = row.sentAt || row.createdAt;
        const d = val instanceof Date 
          ? val 
          : (val && typeof (val as any).toDate === 'function' 
              ? (val as any).toDate() 
              : new Date(val as any));
        const formatted = d instanceof Date && !isNaN(d.getTime()) 
          ? d.toISOString().replace('T', ' ').substring(0, 19) 
          : 'N/A';
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-semibold font-mono">
            <Clock size={12} className="text-gray-400" />
            {formatted}
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Delivery Status',
      render: (row: EmailLog) => (
        <AppBadge 
          label={row.status.toUpperCase()} 
          variant={row.status === 'sent' ? 'success' : 'warning'} 
        />
      )
    }
  ];

  if (loading) return <AppLoading />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('menu.emails')} 
        description={t('admin.emails_desc')} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AppTable 
            columns={columns} 
            data={logs} 
            keyExtractor={(row) => row.id}
            emptyState={<AppEmptyState />}
          />
        </div>

        <div>
          <AppCard title="SMTP Logger Configuration">
            <div className="text-xs text-gray-500 space-y-4">
              <p className="leading-relaxed">
                The email logger acts as a central communication console. Under normal operation, status changes on enterprise registration triggers SMTP dispatches which log in this database.
              </p>
              <div className="p-3 bg-green-50 border border-green-150 text-green-700 rounded-lg flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed block">
                  All transmissions are encrypted by default via SSL endpoints, guarding institutional network integrations.
                </span>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  );
};
export default Emails;
