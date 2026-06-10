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
import { emailService } from '../../services/emailService';
import { EmailTemplate } from '../../types';
import { FileCode, Variable, ArrowRight } from 'lucide-react';

export const Templates: React.FC = () => {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const list = await emailService.getTemplates();
        setTemplates(list);
        if (list.length > 0) setActiveTemplate(list[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const columns = [
    {
      key: 'name',
      header: 'Communication Trigger Template',
      render: (row: EmailTemplate) => (
        <button 
          onClick={() => setActiveTemplate(row)}
          className={`text-left p-1 rounded-sm w-full font-bold cursor-pointer transition-colors block text-sm ${
            activeTemplate?.id === row.id ? 'text-bu-blue bg-bu-blue/5' : 'text-gray-700 hover:text-bu-bright'
          }`}
        >
          📄 {row.name}
        </button>
      )
    },
    {
      key: 'type',
      header: 'Event Trigger Type',
      render: (row: EmailTemplate) => <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{row.type}</span>
    }
  ];

  if (loading) return <AppLoading />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('menu.templates')} 
        description={t('admin.templates_desc')} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Templates list on the left */}
        <div className="lg:col-span-5">
          <AppTable 
            columns={columns} 
            data={templates} 
            keyExtractor={(row) => row.id}
            emptyState={<AppEmptyState />}
          />
        </div>

        {/* Selected template render/details preview on the right */}
        <div className="lg:col-span-7">
          {activeTemplate ? (
            <div className="space-y-5">
              <AppCard 
                title={`Subject Preview: ${activeTemplate.name}`}
                subtitle="Template details & payload preview"
              >
                <div className="space-y-4 text-xs sm:text-sm">
                  
                  {/* Subject lines */}
                  <div className="space-y-2 border-b border-gray-100 pb-4">
                    <div className="flex gap-2">
                      <span className="font-extrabold text-gray-400 shrink-0 select-none uppercase tracking-wider text-[10px] w-12 mt-0.5">Thai SUb</span>
                      <p className="font-semibold text-gray-950">{activeTemplate.subjectTH}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-extrabold text-gray-400 shrink-0 select-none uppercase tracking-wider text-[10px] w-12 mt-0.5">Eng Sub</span>
                      <p className="font-semibold text-gray-950">{activeTemplate.subjectEN}</p>
                    </div>
                  </div>

                  {/* Body HTML Previews */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1 bg-gray-50 p-4 border border-gray-100 rounded-xl">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Thai Language Body Structure</span>
                      <div 
                        className="text-xs text-gray-600 mt-2 p-1 border-l-2 border-bu-blue leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: activeTemplate.bodyTH }}
                      />
                    </div>

                    <div className="space-y-1 bg-gray-50 p-4 border border-gray-100 rounded-xl">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">English Language Body Structure</span>
                      <div 
                        className="text-xs text-gray-600 mt-2 p-1 border-l-2 border-bu-blue leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: activeTemplate.bodyEN }}
                      />
                    </div>
                  </div>

                  {/* Variables glossary */}
                  <div className="p-3.5 bg-bu-slate/50 border border-gray-150 rounded-lg space-y-2">
                    <span className="font-extrabold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Variable size={14} className="text-bu-blue" /> Allowed Dynamic Placeholders
                    </span>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono leading-none">
                      <span className="bg-white border text-gray-600 px-2.5 py-1 rounded-sm">{"{{companyName}}"}</span>
                      <span className="bg-white border text-gray-600 px-2.5 py-1 rounded-sm">{"{{boothNumber}}"}</span>
                      <span className="bg-white border text-gray-600 px-2.5 py-1 rounded-sm">{"{{contactPerson}}"}</span>
                    </div>
                  </div>
                </div>
              </AppCard>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
              Select a template to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Templates;
