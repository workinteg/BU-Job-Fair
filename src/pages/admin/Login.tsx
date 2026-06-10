/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../firebase/AuthContext';
import { useRouter } from '../../routes/Router';
import { useTranslation } from '../../i18n/LanguageContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { AppButton } from '../../components/AppButton';
import { LogIn, AlertCircle, Settings, HelpCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loginMock, isAuthenticated } = useAuth();
  const { navigate } = useRouter();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Detect if the app is currently running inside an iframe (preview environment)
  React.useEffect(() => {
    try {
      setIsEmbedded(window.self !== window.top);
    } catch {
      setIsEmbedded(true);
    }
  }, []);

  // If already authenticated, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleBypassLogin = async () => {
    setLoading(true);
    try {
      await loginMock('workinteg@bu.ac.th', 'superAdmin');
      navigate('/admin');
    } catch (err) {
      console.error('Bypass login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await login();
      navigate('/admin');
    } catch (err: any) {
      console.error('Login action error:', err);
      // Map error message
      if (err.message === 'INVALID_DOMAIN') {
        setErrorMsg(
          language === 'th'
            ? 'ระบบอนุญาตเฉพาะบัญชีมหาวิทยาลัยกรุงเทพ (@bu.ac.th)'
            : 'This system is restricted to Bangkok University accounts (@bu.ac.th)'
        );
      } else if (err.message === 'UNAUTHORIZED_ACCOUNT' || err.message === 'Unauthorized account.') {
        setErrorMsg(
          language === 'th'
            ? 'บัญชีของท่านยังไม่ได้รับสิทธิ์ใช้งานระบบ'
            : 'Your account is not authorized to access this system.'
        );
      } else if (err.message === 'ACCOUNT_DISABLED') {
        setErrorMsg(
          language === 'th'
            ? 'บัญชีผู้ใช้นี้ถูกปิดใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ'
            : 'This account has been disabled. Please contact the administrator.'
        );
      } else if (
        err.code === 'auth/network-request-failed' ||
        err.message?.includes('network-request-failed')
      ) {
        setErrorMsg(
          language === 'th'
            ? 'การเข้าสู่ระบบล้มเหลวเนื่องจากการเชื่อมต่อถูกบล็อก (network-request-failed) มักเกิดจากนโยบายรักษาความปลอดภัยเมื่อรันภายใต้ iframe แนะนำให้คลิกปุ่มเปิดระบบในแท็บใหม่ด้านล่างเพื่อแก้ปัญหานี้'
            : 'Google Sign-In failed due to network-request-failed. This is triggered when browser privacy policies block authentication checks inside iframes. Please click the Open System in New Tab button below.'
        );
      } else if (
        err.code === 'auth/popup-closed-by-user' ||
        err.message?.includes('popup-closed-by-user')
      ) {
        setErrorMsg(
          language === 'th'
            ? 'หน้าต่างล็อกอิน Google ถูกปิดลงก่อนล็อกอินเสร็จสมบูรณ์'
            : 'Google auth sign-in popup window was closed before completion.'
        );
      } else {
        setErrorMsg(
          language === 'th'
            ? `การเข้าสู่ระบบล้มเหลว (${err.message || 'unknown error'}) แนะนำให้คลิกปุ่มเปิดระบบในแท็บใหม่ด้านล่างเพื่อแก้ปัญหานี้`
            : `Authentication failed (${err.message || 'unknown error'}). We highly recommend opening the system in parent tab below.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-55 border-b-4 border-bu-blue relative px-4 py-12 scroll-smooth">
      {/* Floating Language Switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 transition-all duration-300 transform hover:scale-[1.01]">
        {/* BU Color Bar Theme */}
        <div className="h-2 bg-bu-blue w-full" />
        
        <div className="p-8 sm:p-10 flex flex-col items-center">
          {/* BU Brand Logo Placeholder */}
          <div className="w-20 h-20 rounded-2xl bg-bu-blue text-white flex items-center justify-center font-black text-3xl shadow-md mb-6 transform hover:rotate-6 transition-all duration-300">
            BU
          </div>

          {/* Titles */}
          <h2 className="text-xl font-bold text-slate-900 text-center tracking-tight leading-7">
            {t('app.title')}
          </h2>
          <p className="text-sm font-semibold text-bu-blue mt-1 uppercase tracking-wider">
            {t('app.subtitle')}
          </p>
          <div className="w-12 h-1 bg-slate-200 rounded-sm my-4" />
          
          <p className="text-xs text-slate-500 text-center max-w-xs mb-8">
            {language === 'th' 
              ? 'ระบบพอร์ทัลความร่วมมือและตรวจสอบข้อมูลผู้ลงทะเบียนสำหรับผู้ใช้งานคณะทำงาน มหาวิทยาลัยกรุงเทพ'
              : 'Work Integrated Administration and Vendor Coordinator Console for Bangkok University Staff'}
          </p>

          {/* Status Display: Error Message */}
          {errorMsg && (
            <div className="w-full mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 animate-fade-in">
              <AlertCircle className="text-bu-danger shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-slate-700 font-medium leading-relaxed">
                {errorMsg}
              </div>
            </div>
          )}

          {/* Iframe detection & smart warning with interactive call-to-action */}
          {isEmbedded && (
            <div className="w-full mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col gap-3 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-slate-700 font-medium leading-relaxed">
                  {language === 'th'
                    ? 'ระบบทำงานพบว่ากำลังรันภายใต้ Sandbox IFrame (บราวเซอร์มักจะบล็อกระบบความปลอดภัยในการยืนยันตัวตน Google Popup) แนะนำให้กดเปิดระบบในแท็บใหม่เพื่อล็อกอินจริงได้อย่างราบรื่น'
                    : 'App is running inside a preview iframe. Privacy/cookie settings of most browsers block Google Login inside frames. Click below to open in a new tab.'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
              >
                <span>🗂️</span>
                {language === 'th' ? 'เปิดพอร์ทัลในแท็บใหม่' : 'Open Portal in New Tab'}
              </button>
            </div>
          )}

          {/* Sign In Button */}
          <AppButton
            variant="primary"
            onClick={handleGoogleLogin}
            isLoading={loading}
            className="w-full py-3 px-5 text-sm font-bold flex items-center justify-center gap-2.5 rounded-xl transition-all duration-300 active:scale-[0.98]"
          >
            {!loading && <LogIn size={18} />}
            {language === 'th' ? 'เข้าสู่ระบบด้วย Google Account' : 'Sign in with Google'}
          </AppButton>

          {/* Troubleshooting and Developer mode link toggle */}
          <div className="w-full mt-4 pt-4 border-t border-slate-100 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowTroubleshoot(!showTroubleshoot)}
              className="text-xs text-bu-blue hover:underline font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center"
            >
              <HelpCircle size={14} />
              {language === 'th' ? 'หากเข้าสู่ระบบไม่ได้ / สำหรับนักพัฒนา' : 'Troubleshooting / For Developers'}
            </button>

            {showTroubleshoot && (
              <div className="w-full mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 animate-fade-in text-left">
                <div className="flex items-start gap-1.5">
                  <Settings className="text-slate-500 shrink-0 mt-0.5" size={16} />
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'th' ? 'แนวทางแก้ไขปัญหาระบบ (Troubleshooting)' : 'System Solutions'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-700">
                    {language === 'th' ? '1. เข้าสู่ระบบแบบแท็บใหม่ (ในกรณีเปิดแบบแซนด์บล็อก):' : '1. Open in a New Tab:'}
                  </p>
                  <p className="pl-3 leading-relaxed">
                    {language === 'th' 
                      ? 'บราวเซอร์มักล็อกการทำงาน Popup ภายในเฟรมพรีวิว (iframe) ให้กดปุ่ม "เปิดพอร์ทัลในแท็บใหม่" ด้านบนเพื่อล็อกอินใหม่อีกครั้ง' 
                      : 'Browsers block auth popups in iframe previews. Open in a new tab using the yellow button above.'}
                  </p>

                  <p className="font-semibold text-slate-700 pt-1">
                    {language === 'th' ? '2. เพิ่ม Authorized Domains ใน Firebase Console:' : '2. Add Authorized Domains in Firebase Console:'}
                  </p>
                  <p className="pl-3 leading-relaxed">
                    {language === 'th' 
                      ? 'ตรวจสอบให้แน่ใจว่าได้เพิ่มชื่อโดเมนหลักและพรีวิวเหล่านี้ลงในระบบของท่านแล้ว (Firebase Console -> Authentication -> Settings -> Authorized Domains)' 
                      : 'Make sure your Firebase project authorises these domains (Firebase Console -> Authentication -> Settings -> Authorized Domains):'}
                  </p>
                  <div className="bg-white p-2 rounded border border-slate-200 text-[10px] font-mono break-all space-y-1.5 text-slate-500 select-all">
                    <div>ais-dev-7lpf7vswyzhz4kx4olwypc-871318530980.asia-east1.run.app</div>
                    <div>ais-pre-7lpf7vswyzhz4kx4olwypc-871318530980.asia-east1.run.app</div>
                  </div>

                  <div className="border-t border-slate-200 my-3.5 pt-3">
                    <p className="font-semibold text-amber-800 flex items-center gap-1 mb-2">
                      <span>⚠️</span>
                      {language === 'th' ? 'เข้าสู่ระบบจำลอง (Developer Bypass)' : 'Developer Session Bypass'}
                    </p>
                    <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                      {language === 'th' 
                        ? 'หากต้องการข้าม Google Auth ไปหน้าตั้งค่าและตรวจสอบข้อมูล แอดมินสามารถกดปุ่มเข้าสู่ระบบจำลองด้วยสิทธิ์ Super Admin ทันที' 
                        : 'If you want to skip Google Auth to quickly preview system features, you can log in as Super Admin instantly using sandbox credentials.'}
                    </p>
                    <AppButton
                      variant="outline"
                      type="button"
                      onClick={handleBypassLogin}
                      className="w-full py-2 px-3 text-xs font-bold border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-900 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98]"
                    >
                      <span>⚙️</span>
                      {language === 'th' ? 'ข้ามระบบล็อกอิน (Login as Super Admin)' : 'Bypass / Log in as Super Admin'}
                    </AppButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Policy Reminder Disclaimer */}
          <p className="text-[10px] text-slate-400 mt-6 text-center leading-relaxed max-w-[280px]">
            {language === 'th'
              ? 'สำหรับเจ้าหน้าที่และบัญชีมหาวิทยาลัยกรุงเทพ (@bu.ac.th) เท่านั้น ระบบจะตรวจสอบสิทธิ์ผู้เข้าร่วมงานโดยอัตโนมัติ'
              : 'Exclusively restricted to authorized Bangkok University (@bu.ac.th) accounts. Security access checks are audited.'}
          </p>
        </div>
      </div>
    </div>
  );
};
