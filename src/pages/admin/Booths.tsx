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
import { boothService } from '../../services/boothService';
import { Company, Booth } from '../../types';
import { companyService } from '../../services/companyService';
import { Map, Info, Check, Trash, MapPin } from 'lucide-react';

export const Booths: React.FC = () => {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const fetchBoothsAndCompanies = async () => {
      try {
        const [bl, cl] = await Promise.all([
          boothService.getAll(),
          companyService.getAll()
        ]);
        setBooths(bl);
        setCompanies(cl);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoothsAndCompanies();
  }, []);

  const getCompanyLabel = (cId?: string) => {
    if (!cId) return null;
    const cmp = companies.find(c => c.id === cId);
    return cmp ? cmp.nameEN : 'Unassigned';
  };

  const getBoothBadgeVariant = (status: Booth['status']) => {
    switch (status as string) {
      case 'available': return 'success';
      case 'reserved': return 'primary';
      case 'occupied': return 'danger';
      case 'disabled': return 'secondary';
      default: return 'primary';
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Booth Code',
      render: (row: Booth) => <span className="font-mono font-bold text-gray-900">{row.boothCode || row.id}</span>
    },
    {
      key: 'label',
      header: 'Exhibition Info',
      render: (row: Booth) => (
        <span className="font-semibold text-gray-700 text-sm">
          {row.zone ? `${row.zone} (${row.size})` : ((row as any).label || 'N/A')}
        </span>
      )
    },
    {
      key: 'company',
      header: 'Assigned Enterprise',
      render: (row: Booth) => {
        const companyId = (row as any).companyId;
        const remarks = row.remarks;
        if (companyId) {
          return (
            <span className="font-semibold text-xs text-bu-bright block truncate max-w-xs bg-blue-50 px-2 py-1 rounded-sm border border-blue-105/40">
              📍 {getCompanyLabel(companyId)}
            </span>
          );
        } else if (remarks) {
          return (
            <span className="font-semibold text-xs text-indigo-700 block truncate max-w-xs bg-indigo-50 px-2 py-1 rounded-sm border border-indigo-100">
              ℹ️ {remarks}
            </span>
          );
        } else if (row.status === 'reserved' || row.status === 'occupied') {
          return <span className="text-gray-500 text-xs italic">Reserved (No company linked)</span>;
        }
        return <span className="text-gray-400 text-xs italic">Vacant space</span>;
      }
    },
    {
      key: 'status',
      header: t('status'),
      render: (row: Booth) => (
        <AppBadge 
          label={row.status.toUpperCase()} 
          variant={getBoothBadgeVariant(row.status)} 
        />
      )
    }
  ];

  if (loading) return <AppLoading />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('menu.booths')} 
        description={t('admin.booths_desc')} 
      />

      {/* ================= MAP LAYOUT MATRIX ================= */}
      <AppCard title="Exhibition Space Layout Preview">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pb-2 border-b border-gray-100">
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-bu-success block border border-bu-success/20"></span>Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-bu-blue block border border-bu-blue/20"></span>Assigned</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-gray-300 block border border-gray-400/20"></span>Disabled</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 py-2 text-center text-xs">
            {booths.map((b) => (
              <div 
                key={b.id}
                className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all hover:scale-103
                  ${b.status === 'available' ? 'bg-green-50/50 border-green-200 text-green-800' : ''}
                  ${b.status === 'reserved' ? 'bg-bu-blue/5 border-bu-blue/20 text-bu-blue' : ''}
                  ${b.status === 'disabled' ? 'bg-gray-100/70 border-gray-200 text-gray-450' : ''}
                `}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider">Hall Area</span>
                  <MapPin size={10} className="opacity-60" />
                </div>
                <span className="block font-black text-lg font-mono">{b.id}</span>
                <span className="block text-[9px] font-extrabold tracking-wide uppercase opacity-75 truncate px-1">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </AppCard>

      {/* ================= DETAIL TABLES ================= */}
      <div className="grid grid-cols-1 gap-6">
        <AppTable 
          columns={columns} 
          data={booths} 
          keyExtractor={(row) => row.id}
          emptyState={<AppEmptyState />}
        />
      </div>
    </div>
  );
};
export default Booths;
