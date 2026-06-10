/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from '../../routes/Router';
import { useTranslation } from '../../i18n/LanguageContext';
import { AppButton } from '../../components/AppButton';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { navigate } = useRouter();
  const { language } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-full bg-red-50 text-bu-danger flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldAlert size={36} />
        </div>

        {/* Titles */}
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {language === 'th' ? 'ไม่มีสิทธิ์เข้าถึงหน้านี้' : 'Access Denied'}
        </h2>
        <p className="text-xs text-bu-danger font-semibold mt-1 uppercase tracking-widest">
          {language === 'th' ? 'ระดับสิทธิ์การเข้าใช้งานไม่ถูกต้อง' : 'Insufficient System Privileges'}
        </p>

        <div className="w-12 h-1 bg-slate-100 rounded-sm my-4 mx-auto" />

        {/* Description text */}
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          {language === 'th'
            ? 'บัญชีของท่านไม่มีสิทธิ์ในการเข้าใช้งานส่วนนี้ เฉพาะกลุ่มผู้ใช้ระดับสูง (Super Admin) เท่านั้น คณะทำงานระดับปกติสามารถใช้งานหน้าเมนูมาตรฐานที่สอดคล้องกับสิทธิ์ที่ได้รับมอบหมาย'
            : 'Your account is restricted from accessing this panel. This page is limited to Super Administrators only. Please contact system architects or head of admissions if you believe you require this access.'}
        </p>

        {/* Action Button */}
        <AppButton
          variant="outline"
          onClick={() => navigate('/admin')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          {language === 'th' ? 'กลับสู่แผงควบคุมหลัก' : 'Back to Dashboard'}
        </AppButton>
      </div>
    </div>
  );
};
