/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../firebase/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { AppCard } from '../../components/AppCard';
import { AppLoading } from '../../components/AppLoading';
import { landingContentService } from '../../services/landingContentService';
import { LandingContent } from '../../types';
import { 
  Save, 
  Eye, 
  Globe, 
  Sparkles, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Edit3
} from 'lucide-react';

export const HomepageContent: React.FC = () => {
  const { language } = useTranslation();
  const { user } = useAuth();
  const operatorEmail = user?.email || 'workinteg@bu.ac.th';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [form, setForm] = useState<LandingContent>({
    heroTitleTH: '',
    heroTitleEN: '',
    heroDescriptionTH: '',
    heroDescriptionEN: '',
    registerButtonTextTH: '',
    registerButtonTextEN: '',
    heroImageUrl: '',
    showHeroImage: true,
    contactEmail: '',
    contactPhone: '',
    footerTextTH: '',
    footerTextEN: '',
    updatedAt: new Date()
  });

  // Load Data
  useEffect(() => {
    const loadHomepageData = async () => {
      try {
        const data = await landingContentService.getHomepage();
        setForm(data);
      } catch (err: any) {
        setErrorMsg(language === 'th' ? 'โหลดข้อมูลขัดข้อง' : 'Failed to load content data');
      } finally {
        setLoading(false);
      }
    };
    loadHomepageData();
  }, [language]);

  const validateForm = (): boolean => {
    if (!form.heroTitleTH.trim() || !form.heroTitleEN.trim()) {
      setErrorMsg(language === 'th' ? 'กรุณากรอกหัวข้อ Hero (Hero Title) ทั้งภาษาไทยและภาษาอังกฤษ' : 'Hero Title is required in both TH and EN');
      return false;
    }
    if (!form.heroDescriptionTH.trim() || !form.heroDescriptionEN.trim()) {
      setErrorMsg(language === 'th' ? 'กรุณากรอกรายละเอียดเด่น (Hero Description) ทั้งภาษาไทยและภาษาอังกฤษ' : 'Hero Description is required in both TH and EN');
      return false;
    }
    if (form.contactEmail && !/\S+@\S+\.\S+/.test(form.contactEmail)) {
      setErrorMsg(language === 'th' ? 'รูปแบบอีเมลสำหรับติดต่อไม่ถูกต้อง' : 'Contact Email format is invalid');
      return false;
    }
    return true;
  };

  const handleUpdateField = (key: keyof LandingContent, value: any) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }));
    setErrorMsg(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(language === 'th' ? 'รองรับเฉพาะไฟล์ JPG, PNG, และ WEBP เท่านั้น' : 'Only JPG, PNG and WEBP image formats are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(language === 'th' ? 'ขนาดไฟล์ห้ามเกิน 5MB' : 'Image size cannot exceed 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateField('heroImageUrl', reader.result);
        setSuccessMsg(language === 'th' ? 'อัปโหลดสำเร็จแล้ว (กำลังพรีวิวรูปภาพ)' : 'Image loaded successfully (preview ready)');
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Keep Save as Draft inside the Local State/CMS logic
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Save draft can append a tag or notify the admin
      await landingContentService.updateHomepage({ ...form }, operatorEmail);
      setSuccessMsg(language === 'th' ? 'บันทึกฉบับร่างเรียบร้อยแล้ว!' : 'Saved draft content successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Firestore Save Error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await landingContentService.updateHomepage({ ...form }, operatorEmail);
      setSuccessMsg(language === 'th' ? 'เผยแพร่ข้อมูลขึ้นหน้าเว็บไซต์จริงเรียบร้อยแล้ว!' : 'Published landing page content successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Firestore Publish Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppLoading text="Loading Homepage Content configuration..." />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={language === 'th' ? 'จัดการหน้าแรก CMS' : 'Homepage Content Management'} 
        description={language === 'th' ? 'ปรับแต่งข้อมูล หัวข้อ ภาพสไลด์ อีเมลติดต่อ และส่วนอื่น ๆ ของหน้าแรกเว็บไซต์ระบบลงทะเบียน' : 'Modify headers, hero details, graphics, contact info, and footers of the public landing page.'} 
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-5 py-3 font-semibold text-sm cursor-pointer border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'edit' 
              ? 'border-bu-blue text-bu-blue bg-white' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Edit3 size={16} />
          {language === 'th' ? 'แก้ไขข้อมูล' : 'Edit CMS Content'}
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-5 py-3 font-semibold text-sm cursor-pointer border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'preview' 
              ? 'border-bu-blue text-bu-blue bg-white' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Eye size={16} />
          {language === 'th' ? 'ดูพรีวิวหน้าจริง' : 'Live Preview'}
        </button>
      </div>

      {/* Status Alerts */}
      {successMsg && (
        <div id="cms-success-alert" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div id="cms-error-alert" className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-3 animate-fade-in">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {activeTab === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          
          {/* Main Editing Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Hero Section Content */}
            <AppCard 
              title={language === 'th' ? '1. ส่วนหัวโฆษณา (Hero Section)' : '1. Hero Section Content'}
              subtitle={language === 'th' ? 'หัวข้อหลัก รายละเอียด และปุ่มลงทะเบียน' : 'Main page banner title, content description, and action button'}
            >
              <div className="grid grid-cols-1 gap-5">
                {/* Thai Hero Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Hero Title (TH) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.heroTitleTH}
                    onChange={(e) => handleUpdateField('heroTitleTH', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="ยินดีต้อนรับสู่..."
                  />
                </div>

                {/* English Hero Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Hero Title (EN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.heroTitleEN}
                    onChange={(e) => handleUpdateField('heroTitleEN', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="Welcome to..."
                  />
                </div>

                {/* Thai Hero Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Hero Description (TH) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.heroDescriptionTH}
                    onChange={(e) => handleUpdateField('heroDescriptionTH', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="อธิบายรายละเอียดเกี่ยวกับงาน..."
                  />
                </div>

                {/* English Hero Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Hero Description (EN) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.heroDescriptionEN}
                    onChange={(e) => handleUpdateField('heroDescriptionEN', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="Describe the registration details here..."
                  />
                </div>

                {/* Button Texts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Button Label (TH)
                    </label>
                    <input
                      type="text"
                      value={form.registerButtonTextTH}
                      onChange={(e) => handleUpdateField('registerButtonTextTH', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                      placeholder="ลงทะเบียนที่นี่"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Button Label (EN)
                    </label>
                    <input
                      type="text"
                      value={form.registerButtonTextEN}
                      onChange={(e) => handleUpdateField('registerButtonTextEN', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                      placeholder="Register Now"
                    />
                  </div>
                </div>
              </div>
            </AppCard>

            {/* 2. Banner Graphics Upload */}
            <AppCard 
              title={language === 'th' ? '2. ภาพส่วนหัวเด่น (Hero Graphic)' : '2. Hero Graphic'}
              subtitle={language === 'th' ? 'อัปโหลดภาพแบนเนอร์แสดงด้านขวาสุดของเนื้อหา' : 'Showcase banners to display on desktop landing layouts'}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="showHeroImage"
                    checked={form.showHeroImage}
                    onChange={(e) => handleUpdateField('showHeroImage', e.target.checked)}
                    className="rounded-sm border-gray-300 text-bu-blue focus:ring-bu-blue/20"
                  />
                  <label htmlFor="showHeroImage" className="text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none">
                    {language === 'th' ? 'เปิดใช้งาน / แสดงภาพส่วนหัวแบนเนอร์' : 'Enable / Show Hero Graphic on landing page'}
                  </label>
                </div>

                {form.showHeroImage && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    {/* Upload drop section */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-bu-blue/50 transition-colors flex flex-col items-center justify-center text-center relative bg-gray-50/50">
                      <Upload className="text-gray-400 mb-2" size={28} />
                      <span className="text-xs font-bold text-gray-700 mb-1">{language === 'th' ? 'คลิกอัปโหลดภาพแบนเนอร์' : 'Change Hero Banner'}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{language === 'th' ? 'รองรับ JPG, PNG, WEBP ไม่เกิน 5MB' : 'JPG, PNG or WEBP (Max 5MB)'}</span>
                      
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>

                    {/* Preview box */}
                    <div className="border border-gray-200 rounded-xl p-2 bg-white flex items-center justify-center min-h-[140px] relative overflow-hidden group">
                      {form.heroImageUrl ? (
                        <>
                          <img 
                            src={form.heroImageUrl} 
                            alt="Hero Banner Preview" 
                            className="max-h-[130px] rounded-lg object-contain w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateField('heroImageUrl', '')}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all text-xs opacity-0 group-hover:opacity-100 cursor-pointer shadow-xs"
                            title="Remove image"
                          >
                            &times;
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-6 text-xs flex flex-col items-center gap-1">
                          <ImageIcon size={24} className="text-gray-300" />
                          <span>{language === 'th' ? 'ไม่มีรูปภาพชั่วคราว (จะใช้ภาพจำลองเริ่มต้น)' : 'No custom graphic loaded (default placeholder applies)'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AppCard>

            {/* 3. Footer and Contacts info */}
            <AppCard 
              title={language === 'th' ? '3. ข้อมูลติดต่อและฟุตเตอร์ (Contact & Footer)' : '3. Contact & Footer details'}
              subtitle={language === 'th' ? 'อีเมล เบอร์ติดต่อ และลิขสิทธิ์ฟุตเตอร์ด้านล่างสุด' : 'Contact channels and standard copyright footer text'}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    {language === 'th' ? 'อีเมลติดต่อ' : 'Contact Email'}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => handleUpdateField('contactEmail', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                      placeholder="support@bu.ac.th"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    {language === 'th' ? 'เบอร์ติดต่อ' : 'Contact Phone'}
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={form.contactPhone}
                      onChange={(e) => handleUpdateField('contactPhone', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                      placeholder="02-123-4567"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    {language === 'th' ? 'ข้อความฟุตเตอร์ (TH)' : 'Footer Text (TH)'}
                  </label>
                  <input
                    type="text"
                    value={form.footerTextTH}
                    onChange={(e) => handleUpdateField('footerTextTH', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="ลิขสิทธิ์..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    {language === 'th' ? 'ข้อความฟุตเตอร์ (EN)' : 'Footer Text (EN)'}
                  </label>
                  <input
                    type="text"
                    value={form.footerTextEN}
                    onChange={(e) => handleUpdateField('footerTextEN', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="All Rights Reserved..."
                  />
                </div>
              </div>
            </AppCard>

          </div>

          {/* Sidebar controls for Homepage CMS info */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles size={16} className="text-bu-blue" />
                CMS Controller
              </h3>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                {language === 'th' 
                  ? 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนกดเผยแพร่ ระบบจะใช้ข้อมูลนี้เพื่อนำไปจัดแสดงหน้าลงทะเบียนประชาสัมพันธ์งานทันที' 
                  : 'Ensure all required configurations are validated before committing updates. Changes are delivered to target clients in real-time.'}
              </p>

              <hr className="border-gray-100" />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileText size={14} />
                  {language === 'th' ? 'บันทึกแบบร่าง (Save Draft)' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving}
                  className="w-full py-2.5 px-4 bg-bu-blue hover:bg-bu-blue/90 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving 
                    ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') 
                    : (language === 'th' ? 'เผยแพร่ทันที (Publish)' : 'Publish Changes')
                  }
                </button>
              </div>

              <div className="bg-bu-slate/40 rounded-lg p-3 text-[10px] text-gray-400 font-mono space-y-1 border">
                <div>Operator: {operatorEmail}</div>
                <div>Server status: ONLINE</div>
                <div>Last Commit: {form.updatedAt ? new Date(form.updatedAt).toLocaleString() : 'Never'}</div>
              </div>

            </div>

            {/* Quick Preview Tips */}
            <div className="bg-bu-blue/5 border border-bu-blue/10 rounded-xl p-5 space-y-2">
              <span className="text-xs font-extrabold text-bu-blue uppercase tracking-widest block">💡 Tip</span>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'th' 
                  ? 'คุณสามารถสลับแท็บ "ดูพรีวิวหน้าจริง" ด้านบน เพื่อตรวจสอบการแสดงผลทั้งภาษาไทยและอังกฤษก่อนที่จะกดเผยแพร่จริงเพื่อความเรียบร้อย' 
                  : 'Toggle to the "Live Preview" tab above any time to see how the responsive structures render for visitors.'}
              </p>
            </div>

          </div>

        </div>
      ) : (
        /* REALTIME PUBLIC PREVIEW RENDERER */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md max-w-5xl mx-auto mb-12">
          {/* Mock Public Bar */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2 text-[11px] font-mono text-gray-400">
            <Globe size={12} className="text-bu-blue" />
            <span>https://bu-jobfair.net/preview_mode=admin_draft</span>
            <span className="ml-auto bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full text-[9px] uppercase">Draft Preview</span>
          </div>

          <div className="bg-bu-slate min-h-screen">
            
            {/* HERO SECTION MOCK */}
            <section className="bg-gradient-to-br from-bu-blue/95 to-slate-900 text-white py-14 sm:py-20 px-6 overflow-hidden relative">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-6 text-left">
                  <span className="inline-block bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">
                    {language === 'th' ? 'พรีวิวหน้างาน' : 'PUBLIC PAGE PREVIEW'}
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                    {language === 'th' ? form.heroTitleTH : form.heroTitleEN}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl">
                    {language === 'th' ? form.heroDescriptionTH : form.heroDescriptionEN}
                  </p>
                  <div>
                    <button className="bg-white text-bu-blue hover:bg-gray-100 px-6 py-3 rounded-xl font-bold text-sm tracking-wide shadow-xs pointer-events-none">
                      {language === 'th' ? (form.registerButtonTextTH || 'ลงทะเบียน') : (form.registerButtonTextEN || 'Register')}
                    </button>
                  </div>
                </div>

                {form.showHeroImage && (
                  <div className="md:col-span-5 flex justify-center">
                    {form.heroImageUrl ? (
                      <img 
                        src={form.heroImageUrl} 
                        alt="Hero Banner" 
                        className="max-h-[300px] rounded-2xl shadow-xl border border-white/10"
                      />
                    ) : (
                      <div className="w-full aspect-video rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-8 text-center text-white/40">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span className="text-xs font-semibold">{language === 'th' ? 'ไม่มีรูปแบนเนอร์หลักระบุไว้' : 'No hero graphic specified'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* QUICK EVENT INFO SECTION MOCK */}
            <section className="py-12 bg-white px-6">
              <div className="max-w-5xl mx-auto space-y-6 text-center">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  {language === 'th' ? '📅 ข้อมูลรายละเอียดและกำหนดการ' : '📅 Event Information & Scheduling'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="p-5 border border-gray-150 rounded-xl space-y-2 bg-bu-slate/40">
                    <span className="block text-xs font-bold text-bu-blue uppercase tracking-wider">{language === 'th' ? 'ลงทะเบียนแสดงบูธ' : 'Corporate Booth Booking'}</span>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {language === 'th' ? 'เปิดให้บริษัทลงทะเบียนจับจองบูธสำหรับแนะนำงาน รับสมัครพนักงาน และจัดแสดงผลิตภัณฑ์ในงาน' : 'Official partner corporations can register to book premium booth layouts and setup locations.'}
                    </p>
                  </div>
                  <div className="p-5 border border-gray-150 rounded-xl space-y-2 bg-bu-slate/40">
                    <span className="block text-xs font-bold text-bu-blue uppercase tracking-wider">{language === 'th' ? 'ผู้ประสานงาน' : 'Coordinator details'}</span>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {language === 'th' ? 'กรุณาระบุข้อมูลผู้ประสานงานผู้มีอำนาจเพื่อติดตามสถานะการเข้าร่วมและรับจดหมายยืนยันสิทธิ์' : 'Provide authorized details of the point-of-contact to receive automated confirmations and credentials.'}
                    </p>
                  </div>
                  <div className="p-5 border border-gray-150 rounded-xl space-y-2 bg-bu-slate/40">
                    <span className="block text-xs font-bold text-bu-blue uppercase tracking-wider">{language === 'th' ? 'เอกสารยื่นเรื่อง' : 'Submissions Process'}</span>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {language === 'th' ? 'อัปโหลดสัญลักษณ์บริษัท ระบุที่จอดรถ และแจ้งประสงค์รับสมัครงานสหกิจเพื่ออำนวยการอย่างครบครัน' : 'Upload company logotypes, state vehicular parking tallies, and requests for BU cooperative students.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CONTACT SECTION MOCK */}
            <section className="py-10 bg-bu-slate px-6 border-t border-gray-150">
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest">
                  {language === 'th' ? '📞 ข้อมูลสำหรับช่องทางติดต่อ' : '📞 Contact & Inquiries'}
                </h3>
                <div className="flex flex-wrap justify-center gap-6 text-gray-600 text-xs sm:text-sm font-semibold">
                  {form.contactEmail && (
                    <span className="flex items-center gap-2">
                      <Mail size={16} className="text-bu-blue" />
                      {form.contactEmail}
                    </span>
                  )}
                  {form.contactPhone && (
                    <span className="flex items-center gap-2">
                      <Phone size={16} className="text-bu-blue" />
                      {form.contactPhone}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* MOCK FOOTER */}
            <footer className="bg-gray-900 text-gray-400 py-6 text-center text-xs px-6">
              <p>{language === 'th' ? form.footerTextTH : form.footerTextEN}</p>
            </footer>

          </div>
        </div>
      )}
    </div>
  );
};
export default HomepageContent;
