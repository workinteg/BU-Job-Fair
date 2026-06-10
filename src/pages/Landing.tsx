/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { useRouter } from '../routes/Router';
import { isFirebaseConfigured } from '../firebase/firebase';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { landingContentService } from '../services/landingContentService';
import { announcementService } from '../services/announcementService';
import { LandingContent, Announcement } from '../types';
import { 
  CheckCircle, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Database, 
  Layers, 
  Bell, 
  Check, 
  AlertTriangle,
  Search,
  ChevronRight,
  BookOpen,
  Calendar,
  X as CloseIcon,
  Phone,
  Mail,
  Shield,
  Layers as LayersIcon
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { t, language } = useTranslation();
  const { navigate } = useRouter();
  const [showConfigGuide, setShowConfigGuide] = useState(true);

  // States
  const [homepage, setHomepage] = useState<LandingContent>({
    heroTitleTH: 'ยินดีต้อนรับสู่ระบบลงทะเบียน BU Job Fair 2026',
    heroTitleEN: 'Welcome to BU Job Fair 2026 Registration System',
    heroDescriptionTH: 'พบกับโอกาสทางอาชีพมากมายจากบริษัทชั้นนำและบูธความร่วมมือสถาบันชั้นเลิศ',
    heroDescriptionEN: 'Discover numerous career opportunities from leading corporations and institutional partnerships.',
    registerButtonTextTH: 'ลงทะเบียนเข้าแสดงบูธและตำแหน่งงาน',
    registerButtonTextEN: 'Register for Corporate Booth & Jobs',
    heroImageUrl: '',
    showHeroImage: true,
    contactEmail: 'jobfair@bu.ac.th',
    contactPhone: '02-407-3888 ต่อ 2500',
    footerTextTH: '© 2026 มหาวิทยาลัยกรุงเทพ. สงวนลิขสิทธิ์ ทุกประการ.',
    footerTextEN: '© 2026 Bangkok University. All Rights Reserved.',
    updatedAt: new Date()
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Load Homepage and Announcements Realtime
  useEffect(() => {
    // 1. Subscribe to homepage content
    const unsubHome = landingContentService.subscribe((content) => {
      setHomepage(content);
    });

    // 2. Subscribe to announcements
    const unsubAnn = announcementService.subscribe((list) => {
      setAnnouncements(list);
    });

    return () => {
      unsubHome();
      unsubAnn();
    };
  }, []);

  // Filter public announcements (Only show standard Published publications)
  const publicAnnouncements = announcements.filter(ann => {
    const isPublic = ann.isPublished === true;
    const matchesSearch = 
      ann.titleTH.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.titleEN.toLowerCase().includes(searchQuery.toLowerCase());
    return isPublic && matchesSearch;
  });

  return (
    <div className="space-y-12 py-4">
      
      {/* ================= FIREBASE UNPLUGGED WARNING ASSISTANT ================= */}
      {!isFirebaseConfigured && showConfigGuide && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 p-6 sm:p-8 shadow-xs animate-fade-in text-gray-800">
          <button 
            onClick={() => setShowConfigGuide(false)}
            className="absolute top-4 right-4 text-amber-500 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col lg:flex-row gap-6 lg:items-start text-left">
            <div className="p-3 bg-white/80 rounded-xl self-start border border-amber-200 text-amber-500 shadow-2xs">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  {t('firebase.warning_title')}
                  <span className="text-xs bg-amber-200/60 text-amber-800 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                    Setup Notice
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-650 mt-1 max-w-3xl leading-relaxed">
                  {t('firebase.warning_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm font-semibold">
                <div className="bg-white/60 p-4 rounded-xl border border-amber-200/50 flex flex-col gap-1.5">
                  <span className="text-amber-600 font-extrabold">Step 1</span>
                  <p className="text-gray-600 font-normal leading-relaxed">
                    {t('firebase.instruction_step1')}
                  </p>
                </div>
                <div className="bg-white/60 p-4 rounded-xl border border-amber-200/50 flex flex-col gap-1.5">
                  <span className="text-amber-600 font-extrabold">Step 2</span>
                  <p className="text-gray-600 font-normal leading-relaxed">
                    {t('firebase.instruction_step2')}
                  </p>
                </div>
                <div className="bg-white/60 p-4 rounded-xl border border-amber-200/50 flex flex-col gap-1.5">
                  <span className="text-amber-600 font-extrabold">Step 3</span>
                  <p className="text-gray-600 font-normal leading-relaxed">
                    {t('firebase.instruction_step3')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <AppButton 
                  onClick={() => setShowConfigGuide(false)}
                  variant="outline" 
                  size="sm" 
                  className="bg-white border-amber-300 hover:bg-amber-100/50 cursor-pointer text-amber-800 font-bold text-xs"
                >
                  Proceed with Local Sandbox
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO BANNER (DYNAMLICALLY CMS INTEGRATED) ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bu-blue to-indigo-950 text-white p-8 sm:p-12 lg:p-16 shadow-lg text-left">
        {/* Subtle mesh background accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,119,255,0.18),transparent_45%)]" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-bu-bright/15 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold border border-white/15 backdrop-blur-md">
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
              <span>BANGKOK UNIVERSITY ANNUAL PORTALS</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                {language === 'th' ? homepage.heroTitleTH : homepage.heroTitleEN}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-blue-105 font-medium max-w-xl leading-relaxed">
                {language === 'th' ? homepage.heroDescriptionTH : homepage.heroDescriptionEN}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <AppButton 
                onClick={() => navigate('/register')}
                variant="accent" 
                size="lg" 
                className="font-bold cursor-pointer group px-6 py-3.5 bg-white text-bu-blue rounded-xl hover:bg-gray-100"
              >
                {language === 'th' ? (homepage.registerButtonTextTH || 'ลงทะเบียน') : (homepage.registerButtonTextEN || 'Register')}
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform text-bu-blue" />
              </AppButton>

              <AppButton 
                onClick={() => navigate('/admin')}
                variant="outline" 
                size="lg" 
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 font-bold cursor-pointer px-6 py-3.5"
              >
                {t('hero.admin_btn')}
              </AppButton>
            </div>
          </div>

          {/* Featured Graphic if turned on */}
          {homepage.showHeroImage && (
            <div className="md:col-span-5 flex justify-center">
              {homepage.heroImageUrl ? (
                <img 
                  src={homepage.heroImageUrl} 
                  alt="Hero Graphic" 
                  className="max-h-[300px] rounded-2xl shadow-2xl border border-white/10 object-cover"
                />
              ) : (
                <div className="w-full aspect-video rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-8 text-center text-white/45">
                  <LayersIcon size={44} className="mb-2 opacity-50 text-bu-bright" />
                  <span className="text-xs font-semibold">{language === 'th' ? 'ภาพแบนเนอร์หลัก (ปรับแต่งในระบบ CMS ได้)' : 'Hero Banner configuration active'}</span>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* ================= BULLETINS & PUBLIC ANNOUNCEMENTS (CMS) ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Main Bulletin Section (Col Span 8) */}
        <div id="bulletin-section" className="lg:col-span-8 space-y-6">
          <AppCard 
            title={language === 'th' ? '📢 ข่าวประกาศและกิจกรรมอัปเดตล่าสุด' : '📢 Announcements & Engagement Updates'}
            subtitle={language === 'th' ? 'ช่องทางแจ้งกำหนดการและข้อตกลงอย่างเป็นทางการ' : 'Official milestones and announcements from coordinators'}
          >
            {/* Search filter for public announcements */}
            <div className="relative mb-5 max-w-md">
              <Search size={15} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'th' ? 'ค้นหาประกาศข่าวสาร...' : 'Search news...'}
                className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-bu-blue focus:border-bu-blue focus:outline-none"
              />
            </div>

            {publicAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {publicAnnouncements.map((ann) => (
                  <div 
                    key={ann.id}
                    onClick={() => setSelectedAnnouncement(ann)}
                    className="group border border-gray-150 hover:border-bu-blue/50 rounded-xl p-4 flex gap-4 items-center cursor-pointer hover:bg-bu-blue/5/5 bg-white transition-all shadow-3xs"
                  >
                    {ann.featuredImage ? (
                      <img 
                        src={ann.featuredImage} 
                        alt="cover" 
                        className="w-20 h-14 rounded-lg object-cover shrink-0 border" 
                      />
                    ) : (
                      <div className="w-20 h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border text-gray-400">
                        <BookOpen size={20} />
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-bu-blue/10 text-bu-blue font-extrabold px-2 py-0.5 rounded uppercase">
                          Important
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {ann.publishedAt ? new Date(ann.publishedAt as Date).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-bu-blue transition-colors leading-snug">
                        {language === 'th' ? ann.titleTH : ann.titleEN}
                      </h4>
                    </div>

                    <ChevronRight size={18} className="text-gray-300 group-hover:text-bu-blue transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-dashed rounded-xl text-center text-gray-450 text-xs">
                {language === 'th' 
                  ? 'ขณะนี้ยังไม่มีข่าวประกาศประชาสัมพันธ์ระบุไว้' 
                  : 'There are currently no announcements posted.'}
              </div>
            )}
          </AppCard>
        </div>

        {/* Informational Sidebar (Col Span 4) */}
        <div id="side-packages" className="lg:col-span-4 space-y-6">
          <AppCard title="Coordinator Hub" className="h-full bg-linear-to-b from-white to-gray-50/50">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-bu-success shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-bold text-gray-900 border-b border-gray-100 pb-1">Dual-Language Platform</span>
                  <span className="block text-xs text-gray-500 mt-1 leading-relaxed">Full system interface translated English & Thai for global enterprise partners.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-bu-success shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-bold text-gray-900 border-b border-gray-100 pb-1">Automated Confirmations</span>
                  <span className="block text-xs text-gray-500 mt-1 leading-relaxed">Receive automated trigger receipts & booth confirmation packages instantly.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-bu-success shrink-0 mt-0.5" />
                <div>
                  <span className="block text-sm font-bold text-gray-900 border-b border-gray-100 pb-1">Visual Exhibition Maps</span>
                  <span className="block text-xs text-gray-500 mt-1 leading-relaxed">Preview allocated exhibit spaces through an interactive coordinate allocation matrix.</span>
                </div>
              </li>
            </ul>
          </AppCard>
        </div>

      </section>

      {/* ================= FOOTER / CONTACT SECTION (INTEGRATED WITH CMS) ================= */}
      <section className="border-t border-gray-200 pt-10 pb-6 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Quick contact card */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              {language === 'th' ? '📞 ผู้ประสานงานและข้อมูลการติดต่อ' : '📞 Coordinator Information'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md leading-relaxed">
              {language === 'th' 
                ? 'สอบถามรายละเอียดขั้นตอน ข้อเรียกร้อง และการจองจัดแจงบูธนิทรรศการกรุณาติดต่อผ่านช่องทางการงานที่ระบุ' 
                : 'For detailed procedural inquiries regarding bookings or setups, please contact our administrative channels below.'}
            </p>
            <div className="flex flex-col gap-2 font-semibold text-xs text-gray-650">
              {homepage.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-bu-blue shrink-0" />
                  <span>Email: {homepage.contactEmail}</span>
                </div>
              )}
              {homepage.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-bu-blue shrink-0" />
                  <span>Phone: {homepage.contactPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Secure assurance badge card */}
          <div className="space-y-3 md:text-right md:flex md:flex-col md:items-end">
            <div className="flex items-center gap-2 px-3 py-1 bg-bu-blue/5 border border-bu-blue/10 rounded-full text-[10px] font-black text-bu-blue uppercase tracking-widest max-w-xs justify-center shrink-0">
              <Shield size={12} fill="currentColor" className="opacity-15 shrink-0" />
              <span>Verified System Portals</span>
            </div>
            <p className="text-xs text-gray-400 max-w-md md:text-right leading-relaxed">
              {language === 'th' 
                ? homepage.footerTextTH 
                : homepage.footerTextEN}
            </p>
          </div>
        </div>
      </section>

      {/* ================= PUBLIC ANNOUNCEMENT DETAIL VIEW POPUP DIALOG ================= */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-905/70 backdrop-blur-3xs animate-fade-in">
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setSelectedAnnouncement(null)} 
          />
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto relative p-6 space-y-6 shadow-2xl animate-scale-up text-left">
            
            <button 
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-extrabold p-1 bg-gray-50 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              &times;
            </button>

            {/* Header */}
            <div className="border-b border-gray-100 pb-4 space-y-2">
              <span className="inline-block bg-bu-blue/10 text-bu-blue text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                Official Update
              </span>
              <h3 className="text-lg font-black text-gray-900 leading-snug">{language === 'th' ? selectedAnnouncement.titleTH : selectedAnnouncement.titleEN}</h3>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium font-mono">
                <Calendar size={12} />
                <span>Published: {selectedAnnouncement.publishedAt ? new Date(selectedAnnouncement.publishedAt as Date).toLocaleString() : ''}</span>
              </div>
            </div>

            {/* Featured Banner Cover if present */}
            {selectedAnnouncement.featuredImage && (
              <div className="rounded-xl overflow-hidden border">
                <img 
                  src={selectedAnnouncement.featuredImage} 
                  alt="cover" 
                  className="w-full max-h-[220px] object-cover" 
                />
              </div>
            )}

            {/* Rendered HTML */}
            <div 
              className="rich-content-rendered text-sm text-gray-800 leading-relaxed border p-4 rounded-xl bg-gray-55"
              dangerouslySetInnerHTML={{ __html: language === 'th' ? selectedAnnouncement.contentTH : selectedAnnouncement.contentEN }}
            />

            {/* System Info */}
            <div className="text-[9px] text-gray-400 font-mono italic">
              Verified & Issued by Bangkok University Job Fair Organizers
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
