/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../firebase/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { AppLoading } from '../../components/AppLoading';
import { settingsService } from '../../services/settingsService';
import { auditLogService } from '../../services/auditLogService';
import { SystemSettings } from '../../types';
import { Sliders, Save, CheckCircle, Eye, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const config = await settingsService.getSettings();
        setSettings(config);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleToggleRegistration = () => {
    if (!settings) return;
    setSettings({ ...settings, registrationOpen: !settings.registrationOpen });
    setSaveSuccess(false);
  };

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    setSettings({ ...settings, maxCompanies: parseInt(e.target.value) || 0 });
    setSaveSuccess(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    const activeEmail = user?.email || 'workinteg@bu.ac.th';
    setIsSaving(true);
    try {
      await settingsService.saveSettings(settings, activeEmail);
      
      // Log this action to our Audit log service!
      await auditLogService.logAction(
        activeEmail,
        'UPDATE_GLOBAL_SETTINGS',
        `Updated registration status to ${settings.registrationOpen}, cap ${settings.maxCompanies}`
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <AppLoading />;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader 
        title={t('menu.settings')} 
        description={t('admin.settings_desc')} 
      />

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 font-bold flex items-center gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle size={18} className="text-bu-success" />
          Settings parameters synced successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <AppCard title="Operational Controls" subtitle="System enrollment gateways and bounds">
              <div className="space-y-5">
                
                {/* Registration Switch */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-150">
                  <div className="space-y-0.5">
                    <span className="block text-sm font-bold text-gray-900">Registration Portal Switch</span>
                    <span className="block text-xs text-gray-400">Controls whether corporate partners can register a candidacy.</span>
                  </div>
                  
                  {/* Toggle button */}
                  <button
                    type="button"
                    onClick={handleToggleRegistration}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-bu-blue focus:ring-offset-2 ${
                      settings?.registrationOpen ? 'bg-bu-success' : 'bg-gray-250'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        settings?.registrationOpen ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <AppInput 
                    type="number"
                    label="Maximum Sponsor Booths Capacity / บูธสูงสุด"
                    name="maxCompanies"
                    value={settings?.maxCompanies}
                    onChange={handleNumChange}
                    min="1"
                  />

                  <AppInput 
                    label="Recruitment Event Year / ปีจัดกิจกรรม"
                    name="eventYear"
                    value={settings?.eventYear}
                    onChange={handleTextChange}
                  />
                </div>

              </div>
            </AppCard>

            <AppCard title="Dashboard Billboard / ข้อความประกาศแลนดิ้ง" subtitle="Announcements broadcasted to potential corporate applicants">
              <div className="space-y-4">
                <div className="space-y-1.5ClassName">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">
                    Announcement (Thai) / โฆษณาประชาสัมพันธ์ภาษาไทย
                  </label>
                  <textarea
                    rows={3}
                    name="announcementTH"
                    value={settings?.announcementTH}
                    onChange={handleTextChange}
                    className="block w-full rounded-lg border border-gray-300 text-sm py-2.5 px-3 bg-white focus:border-bu-blue focus:ring-1 focus:ring-bu-blue outline-hidden shadow-2xs text-gray-900 border"
                  />
                </div>

                <div className="space-y-1.5ClassName">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">
                    Announcement (English) / ข่าวอิงลิช
                  </label>
                  <textarea
                    rows={3}
                    name="announcementEN"
                    value={settings?.announcementEN}
                    onChange={handleTextChange}
                    className="block w-full rounded-lg border border-gray-300 text-sm py-2.5 px-3 bg-white focus:border-bu-blue focus:ring-1 focus:ring-bu-blue outline-hidden shadow-2xs text-gray-900 border"
                  />
                </div>
              </div>
            </AppCard>
          </div>

          {/* Quick preview sidebar summary details */}
          <div className="space-y-6">
            <AppCard title="Settings Precedence">
              <div className="text-xs text-gray-500 space-y-4">
                <p className="leading-relaxed">
                  Modifying parameters here re-organizes validation layouts on candidate lists and is logged synchronously inside database files.
                </p>
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-150 rounded-lg flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed block">
                    Turning Off the portal immediately displays "Enrollment capacity reached" banners to candidate representatives.
                  </span>
                </div>
              </div>
            </AppCard>

            <div className="flex justify-end gap-3 pt-4">
              <AppButton 
                type="submit" 
                variant="primary" 
                isLoading={isSaving}
                className="px-6 font-bold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Save size={16} />
                Save Preferences
              </AppButton>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};
export default Settings;
