/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { useRouter } from '../routes/Router';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { CheckCircle, Home, FileText, Compass } from 'lucide-react';

export const SuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const { navigate } = useRouter();

  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-6">
      
      {/* Dynamic Animated Success icon check */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-bu-success shadow-2xs">
          <CheckCircle className="w-12 h-12 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          {t('register.success_title')}
        </h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          {t('register.success_desc')}
        </p>
      </div>

      <AppCard className="bg-gray-50/50 border border-gray-150">
        <div className="text-left space-y-3.5 text-xs sm:text-sm">
          <h4 className="font-extrabold text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-1.5">
            What's next? / ขั้นตอนถัดไป
          </h4>
          <ul className="space-y-2.5 text-gray-600 font-medium">
            <li className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-full bg-bu-blue text-white inline-flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
              <span>Our administrative board reviews applicant eligibility criteria & contact indices (usually within 24 hours).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-full bg-bu-blue text-white inline-flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
              <span>Once checked, approved status with coordinate token codes gets dispatched automatically to your registered email.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-full bg-bu-blue text-white inline-flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              <span>Host committees coordinate layout numbers allocation based on specific corporate sponsorship priority packages.</span>
            </li>
          </ul>
        </div>
      </AppCard>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <AppButton 
          variant="outline" 
          onClick={() => navigate('/')}
          className="cursor-pointer font-bold inline-flex items-center gap-1.5"
        >
          <Home size={16} />
          {t('back_to_home')}
        </AppButton>
        
        <AppButton 
          variant="primary" 
          onClick={() => navigate('/admin')}
          className="cursor-pointer font-bold inline-flex items-center gap-1.5"
        >
          <Compass size={16} />
          {t('hero.admin_btn')}
        </AppButton>
      </div>
    </div>
  );
};
export default SuccessPage;
