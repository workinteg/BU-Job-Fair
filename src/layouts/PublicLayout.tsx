/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { useRouter } from '../routes/Router';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { navigate, currentPath } = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-bu-slate">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo area */}
            <div 
              onClick={() => navigate('/')} 
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-bu-blue flex items-center justify-center font-black text-white text-base shadow-sm ring-2 ring-bu-blue/20 group-hover:scale-105 transition-all">
                BU
              </div>
              <div>
                <span className="block text-sm font-extrabold text-bu-blue tracking-tight leading-none">
                  BU JOB FAIR
                </span>
                <span className="block text-[10px] text-gray-500 font-medium tracking-wide mt-1">
                  Registration System
                </span>
              </div>
            </div>

            {/* Navigation links & Control actions */}
            <div className="flex items-center gap-4">
              <span className="hidden md:inline-flex items-center text-xs text-gray-400 gap-1.5 font-medium border-r border-gray-200 pr-4 mr-1">
                <span className="inline-block w-2 h-2 rounded-full bg-bu-success animate-pulse"></span>
                Phase 1 Registration Active
              </span>

              {/* Language Switch */}
              <LanguageSwitcher />

              {/* Admin Portal Toggle */}
              {currentPath.startsWith('/admin') ? (
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all cursor-pointer"
                >
                  Public Web
                </button>
              ) : (
                <button
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-bu-blue hover:bg-opacity-95 shadow-xs rounded-lg transition-all cursor-pointer"
                >
                  {t('hero.admin_btn')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content slot */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-10 text-xs text-gray-500 mt-auto shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center font-black text-gray-500 text-xs">
                  BU
                </div>
                <span className="font-extrabold tracking-tight text-gray-800">
                  {t('app.title')}
                </span>
              </div>
              <p className="leading-relaxed text-gray-400 max-w-md">
                {t('footer.address')}
              </p>
            </div>
            <div className="flex flex-col md:items-end gap-2 text-gray-400 md:text-right">
              <span>{t('footer.copyright')}</span>
              <span className="text-[10px]">
                Built with premium custom layouts for academic stakeholder integrations.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default PublicLayout;
