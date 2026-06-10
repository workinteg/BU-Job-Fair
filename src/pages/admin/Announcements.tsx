/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from '../../routes/Router';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../firebase/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { AppCard } from '../../components/AppCard';
import { AppTable } from '../../components/AppTable';
import { AppLoading } from '../../components/AppLoading';
import { AppEmptyState } from '../../components/AppEmptyState';
import { RichTextEditor } from '../../components/RichTextEditor';
import { announcementService } from '../../services/announcementService';
import { Announcement } from '../../types';
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  Trash2, 
  Edit, 
  Eye, 
  ArrowLeft, 
  TrendingUp, 
  EyeOff, 
  BookOpen,
  Calendar,
  Layers,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export const Announcements: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { language, t } = useTranslation();
  const { user } = useAuth();
  const operatorEmail = user?.email || 'workinteg@bu.ac.th';

  // Sub-routing states
  const isCreateSubpath = currentPath === '/admin/announcements/create';
  const isEditSubpath = currentPath.startsWith('/admin/announcements/') && currentPath.endsWith('/edit');
  const editId = isEditSubpath ? currentPath.split('/')[3] : null;

  // General States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [sortBy, setSortBy] = useState<'sortOrder' | 'createdAt' | 'updatedAt'>('sortOrder');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Detailed Modal view state
  const [viewingAnn, setViewingAnn] = useState<Announcement | null>(null);

  // Form fields for Create / Edit
  const [titleTH, setTitleTH] = useState('');
  const [titleEN, setTitleEN] = useState('');
  const [contentTH, setContentTH] = useState('');
  const [contentEN, setContentEN] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(1);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Subscribe to announcements list
  useEffect(() => {
    let unsub = () => {};
    if (!isCreateSubpath && !isEditSubpath) {
      setLoading(true);
      unsub = announcementService.subscribe(
        (list) => {
          setAnnouncements(list);
          setLoading(false);
        },
        (err) => {
          setErrorMsg(language === 'th' ? 'เกิดความผิดพลาดในการดึงความคืบหน้าข่าวสาร' : 'Error streaming announcements');
          setLoading(false);
        }
      );
    }
    return () => unsub();
  }, [isCreateSubpath, isEditSubpath, language]);

  // 2. Load edit fields if isEditSubpath matches
  useEffect(() => {
    if (isEditSubpath && editId) {
      const loadForEditing = async () => {
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
          const ann = await announcementService.getById(editId);
          if (ann) {
            setTitleTH(ann.titleTH);
            setTitleEN(ann.titleEN);
            setContentTH(ann.contentTH);
            setContentEN(ann.contentEN);
            setFeaturedImage(ann.featuredImage || '');
            setIsPublished(ann.isPublished);
            setSortOrder(ann.sortOrder);
          } else {
            setErrorMsg(language === 'th' ? 'ไม่พบประกาศที่ระบุในสารบบ' : 'Target announcement catalog not found');
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'Error fetching document');
        } finally {
          setLoading(false);
        }
      };
      loadForEditing();
    } else if (isCreateSubpath) {
      // Reset Create fields
      setTitleTH('');
      setTitleEN('');
      setContentTH('');
      setContentEN('');
      setFeaturedImage('');
      setIsPublished(false);
      setSortOrder(1);
      setErrorMsg(null);
      setSuccessMsg(null);
      setLoading(false);
    }
  }, [isCreateSubpath, isEditSubpath, editId, language]);

  // Action: Toggle Publish
  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      setErrorMsg(null);
      await announcementService.update(id, { isPublished: !currentStatus }, operatorEmail);
      setSuccessMsg(
        !currentStatus 
          ? (language === 'th' ? 'เผยแพร่ประกาศเรียบร้อยแล้ว!' : 'Published announcement successfully!') 
          : (language === 'th' ? 'ยกเลิกการเผยแพร่เรียบร้อยแล้ว!' : 'Unpublished announcement successfully!')
      );
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle publishing status');
    }
  };

  // Action: Save Create
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleTH.trim() || !titleEN.trim()) {
      setErrorMsg(language === 'th' ? 'กรุณาระบุหัวข้อประกาศทั้งภาษาไทยและอังกฤษ' : 'Title TH and Title EN are required');
      return;
    }
    if (!contentTH.trim() || !contentEN.trim() || contentTH === '<p></p>' || contentEN === '<p></p>') {
      setErrorMsg(language === 'th' ? 'กรุณาระบุเนื้อหารายละเอียดประกาศทั้งภาษาไทยและอังกฤษ' : 'Content TH and Content EN are required');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await announcementService.create({
        titleTH,
        titleEN,
        contentTH,
        contentEN,
        featuredImage,
        isPublished,
        sortOrder
      }, operatorEmail);
      
      // Navigate back and show message
      navigate('/admin/announcements');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating announcement');
    } finally {
      setSaving(false);
    }
  };

  // Action: Save Edit
  const handleEditAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    if (!titleTH.trim() || !titleEN.trim()) {
      setErrorMsg(language === 'th' ? 'กรุณาระบุหัวข้อประกาศทั้งภาษาไทยและอังกฤษ' : 'Title TH and Title EN are required');
      return;
    }
    if (!contentTH.trim() || !contentEN.trim() || contentTH === '<p></p>' || contentEN === '<p></p>') {
      setErrorMsg(language === 'th' ? 'กรุณาระบุเนื้อหารายละเอียดประกาศทั้งภาษาไทยและอังกฤษ' : 'Content TH and Content EN are required');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await announcementService.update(editId, {
        titleTH,
        titleEN,
        contentTH,
        contentEN,
        featuredImage,
        isPublished,
        sortOrder
      }, operatorEmail);
      
      navigate('/admin/announcements');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating announcement');
    } finally {
      setSaving(false);
    }
  };

  // Action: Delete Announcement
  const handleDelete = async (id: string) => {
    const confirmText = language === 'th' 
      ? 'คุณต้องการลบประกาศนี้อย่างถาวรใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนคืนได้)' 
      : 'Are you sure you want to permanently delete this announcement?';
    if (!window.confirm(confirmText)) return;

    try {
      setErrorMsg(null);
      await announcementService.delete(id, operatorEmail);
      setSuccessMsg(language === 'th' ? 'ลบประกาศเรียบร้อยแล้ว' : 'Announcement deleted successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete announcement');
    }
  };

  // Helper: Image upload base64 preview
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg(language === 'th' ? 'ขนาดไฟล์ภาพหรือนามสกุลต้องเป็น JPG, PNG, WEBP' : 'Supported types: JPG, PNG, WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(language === 'th' ? 'ขนาดไฟล์ห้ามเกิน 5MB' : 'Max size 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFeaturedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter & Search & Sort Announcements
  const filteredAnnouncements = announcements
    .filter(ann => {
      const matchSearch = 
        ann.titleTH.toLowerCase().includes(search.toLowerCase()) ||
        ann.titleEN.toLowerCase().includes(search.toLowerCase());
      
      const matchFilter = 
        statusFilter === 'all' ||
        (statusFilter === 'published' && ann.isPublished) ||
        (statusFilter === 'unpublished' && !ann.isPublished);

      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'sortOrder') {
        comparison = a.sortOrder - b.sortOrder;
      } else {
        const aTime = a[sortBy] instanceof Date ? (a[sortBy] as Date).getTime() : 0;
        const bTime = b[sortBy] instanceof Date ? (b[sortBy] as Date).getTime() : 0;
        comparison = aTime - bTime;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

  // Calculate paginated products
  const pageCount = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) return <AppLoading text="Loading custom Announcement tables..." />;

  // ----------------------------------------------------
  // SCREEN 1: CREATE VIEW
  // ----------------------------------------------------
  if (isCreateSubpath) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => navigate('/admin/announcements')}
            className="p-2 bg-white rounded-lg border hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <PageHeader 
            title={language === 'th' ? 'สร้างประกาศข่าวสารใหม่' : 'Create New Announcement'} 
            description={language === 'th' ? 'กรอกรายละเอียดข้อความ ข่าวประชาสัมพันธ์ สัญลักษณ์ รูปถ่ายสำหรับขึ้นแสดงบนเว็บไซต์' : 'Create announcements with formatted details, images, and sorting parameters.'} 
          />
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-semibold">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleCreateAnnouncement} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          
          <div className="lg:col-span-8 space-y-6">
            
            {/* THAI EDITOR */}
            <AppCard 
              title="รายละเอียดภาษาไทย (Thai Language Materials)"
              subtitle="กำหนดหัวข้อข่าวสาร ประชาสัมพันธ์ และข้อเขียนที่จะแสดงพรีวิวเป็นภาษาไทย"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    หัวข้อประกาศ (TH) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={titleTH}
                    onChange={(e) => setTitleTH(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="ป้อนหัวข้อประโยคสำหรับข่าวประชาสัมพันธ์"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    เนื้อหาและข้อเขียนอย่างละเอียด (TH) <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor value={contentTH} onChange={setContentTH} />
                </div>
              </div>
            </AppCard>

            {/* ENGLISH EDITOR */}
            <AppCard 
              title="รายละเอียดภาษาอังกฤษ (English Language Materials)"
              subtitle="Configure headers, hyperlinks and typography templates in English format"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Announcement Title (EN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={titleEN}
                    onChange={(e) => setTitleEN(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="Enter English header string..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Rich Details Content (EN) <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor value={contentEN} onChange={setContentEN} />
                </div>
              </div>
            </AppCard>

          </div>

          <div className="lg:col-span-4 space-y-6">
            
            {/* Status configuration sidebar card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Publish Configuration</h3>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Sort Order (ลำดับจัดเรียง)</label>
                <input
                  type="number"
                  min="1"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-bu-blue focus:ring-2 focus:ring-bu-blue/10"
                />
                <span className="text-[10px] text-gray-400 block font-medium">ลำดับค่าน้อย (เช่น 1, 2) จะขึ้นแสดงอันดับแรกสุด</span>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="pub_check"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded-sm border-gray-300 text-bu-blue focus:ring-bu-blue/20 cursor-pointer"
                />
                <label htmlFor="pub_check" className="text-xs font-bold text-gray-700 uppercase tracking-wider select-none cursor-pointer">
                  {language === 'th' ? 'เผยแพร่ทันที (Publish)' : 'Mark as Published'}
                </label>
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 bg-bu-blue hover:bg-bu-blue/95 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 "
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : (language === 'th' ? 'สร้างประกาศตอนนี้' : 'Create Now')}
                </button>
              </div>
            </div>

            {/* Featured Image Management */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Featured Image</h3>
              
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-150 rounded-lg p-5 text-center relative bg-gray-50/50 hover:border-bu-blue/55 transition-colors cursor-pointer">
                  <Plus className="text-gray-400 mx-auto mb-1" size={20} />
                  <span className="block text-xs font-bold text-gray-700">{language === 'th' ? 'อัปโหลดภาพประกอบหลัก' : 'Upload Graphic'}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {featuredImage ? (
                  <div className="border border-gray-200 rounded-lg p-1 bg-white relative">
                    <img src={featuredImage} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage('')}
                      className="absolute top-2 right-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full p-1 text-xs"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-3 text-[10px] text-gray-400 font-mono">
                    {language === 'th' ? 'ไม่มีรูปประกอบที่เลือกไว้' : 'No feature illustration selected'}
                  </div>
                )}
              </div>
            </div>

          </div>

        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 2: EDIT VIEW
  // ----------------------------------------------------
  if (isEditSubpath) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => navigate('/admin/announcements')}
            className="p-2 bg-white rounded-lg border hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <PageHeader 
            title={language === 'th' ? 'แก้ไขประกาศข่าวสาร' : 'Edit Announcement'} 
            description={language === 'th' ? `แก้ไขข้อมูล ข่าวสารประสงค์ รหัสอ้างอิง: ${editId}` : `Update current announcement metadata. ID: ${editId}`} 
          />
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-semibold">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleEditAnnouncement} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          
          <div className="lg:col-span-8 space-y-6">
            
            {/* THAI EDITOR */}
            <AppCard 
              title="รายละเอียดภาษาไทย (Thai Language Materials)"
              subtitle="แก้ไขหัวข้อข่าวสาร ประชาสัมพันธ์ และข้อเขียนที่จะแสดงพรีวิวเป็นภาษาไทย"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    หัวข้อประกาศ (TH) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={titleTH}
                    onChange={(e) => setTitleTH(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="ป้อนหัวข้อประโยคสำหรับข่าวประชาสัมพันธ์"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    เนื้อหาและข้อเขียนอย่างละเอียด (TH) <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor value={contentTH} onChange={setContentTH} />
                </div>
              </div>
            </AppCard>

            {/* ENGLISH EDITOR */}
            <AppCard 
              title="รายละเอียดภาษาอังกฤษ (English Language Materials)"
              subtitle="Update headers, hyperlinks and typography templates in English format"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Announcement Title (EN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={titleEN}
                    onChange={(e) => setTitleEN(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-bu-blue/10 focus:border-bu-blue focus:outline-none"
                    placeholder="Enter English header string..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Rich Details Content (EN) <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor value={contentEN} onChange={setContentEN} />
                </div>
              </div>
            </AppCard>

          </div>

          <div className="lg:col-span-4 space-y-6">
            
            {/* Status configuration sidebar card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Publish Configuration</h3>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Sort Order (ลำดับจัดเรียง)</label>
                <input
                  type="number"
                  min="1"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-bu-blue focus:ring-2 focus:ring-bu-blue/10"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="pub_check_edit"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded-sm border-gray-300 text-bu-blue focus:ring-bu-blue/20 cursor-pointer"
                />
                <label htmlFor="pub_check_edit" className="text-xs font-bold text-gray-700 uppercase tracking-wider select-none cursor-pointer">
                  {language === 'th' ? 'เผยแพร่ทันที (Publish)' : 'Mark as Published'}
                </label>
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 bg-bu-blue hover:bg-bu-blue/95 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 "
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : (language === 'th' ? 'บันทึกการแก้ไข' : 'Save Changes')}
                </button>
              </div>
            </div>

            {/* Featured Image Management */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Featured Image</h3>
              
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-150 rounded-lg p-5 text-center relative bg-gray-50/50 hover:border-bu-blue/55 transition-colors cursor-pointer">
                  <Plus className="text-gray-400 mx-auto mb-1" size={20} />
                  <span className="block text-xs font-bold text-gray-700">{language === 'th' ? 'เปลี่ยนภาพประกอบหลัก' : 'Change Graphic'}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {featuredImage ? (
                  <div className="border border-gray-200 rounded-lg p-1 bg-white relative">
                    <img src={featuredImage} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage('')}
                      className="absolute top-2 right-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full p-1 text-xs"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-3 text-[10px] text-gray-400 font-mono">
                    {language === 'th' ? 'ไม่มีรูปประกอบที่เลือกไว้' : 'No feature illustration selected'}
                  </div>
                )}
              </div>
            </div>

          </div>

        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 3: LIST VIEW (MAIN TABLE VIEW)
  // ----------------------------------------------------
  const columns = [
    {
      key: 'title',
      header: language === 'th' ? 'หัวข้อประกาศ (TH / EN)' : 'Title (TH / EN)',
      render: (row: Announcement) => (
        <div className="space-y-1 py-0.5">
          <div className="flex items-center gap-2">
            {row.featuredImage && (
              <img 
                src={row.featuredImage} 
                alt="Mini Banner" 
                className="w-10 h-7 rounded border object-cover shrink-0" 
              />
            )}
            <span className="font-extrabold text-gray-800 text-sm hover:text-bu-blue transition-colors block leading-tight">
              {row.titleTH}
            </span>
          </div>
          <span className="block text-xs text-gray-400 font-medium tracking-wide">
            {row.titleEN || 'No English Translation'}
          </span>
        </div>
      )
    },
    {
      key: 'isPublished',
      header: language === 'th' ? 'สถานะ' : 'Published Status',
      render: (row: Announcement) => (
        <button
          onClick={() => handleTogglePublish(row.id!, row.isPublished)}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold leading-none border transition-all cursor-pointer ${
            row.isPublished 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100' 
              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
          }`}
          title={language === 'th' ? 'คลิกเพื่อสลับสถานะ' : 'Toggle publication'}
        >
          {row.isPublished ? (
            <>
              <Check size={11} className="text-emerald-600 shrink-0" />
              <span>Published</span>
            </>
          ) : (
            <>
              <EyeOff size={11} className="text-amber-600 shrink-0" />
              <span>Draft</span>
            </>
          )}
        </button>
      )
    },
    {
      key: 'sortOrder',
      header: language === 'th' ? 'ลำดับแสดงผล' : 'Sort Order',
      render: (row: Announcement) => (
        <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
          {row.sortOrder}
        </span>
      )
    },
    {
      key: 'updatedAt',
      header: language === 'th' ? 'อัปเดตล่าสุด' : 'Updated At',
      render: (row: Announcement) => {
        const d = row.updatedAt instanceof Date ? row.updatedAt : new Date();
        return (
          <span className="text-xs text-gray-500 font-medium">
            {d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: language === 'th' ? 'ตัวจัดการ' : 'Actions',
      render: (row: Announcement) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setViewingAnn(row)}
            className="p-1 px-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-150 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            title={language === 'th' ? 'เปิดพรีวิวรายละเอียด' : 'Preview Details'}
          >
            <Eye size={13} />
          </button>
          
          <button
            onClick={() => navigate(`/admin/announcements/${row.id}/edit`)}
            className="p-1 px-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
            title={language === 'th' ? 'แก้ไข' : 'Edit'}
          >
            <Edit size={13} />
          </button>

          <button
            onClick={() => handleDelete(row.id!)}
            className="p-1 px-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
            title={language === 'th' ? 'ลบถาวร' : 'Delete'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header and Add Button */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs">
        <PageHeader 
          title={language === 'th' ? 'ประกาศและข่าวสารความร่วมมือ' : 'Announcements & News Board'} 
          description={language === 'th' ? 'ระบบ CMS จดบันทึกและแสดงข้อมูลข่าวสารประชาสัมพันธ์แก่ผู้ลงทะเบียนและบริษัทรับสมัครงาน' : 'Review, post, publish or draft announcements dynamically linked to the public homepage.'} 
        />
        
        <button
          onClick={() => navigate('/admin/announcements/create')}
          className="px-5 py-2.5 text-xs bg-bu-blue text-white font-extrabold rounded-lg shadow-sm hover:shadow-md hover:bg-bu-blue/90 cursor-pointer flex items-center gap-1.5 tracking-wide transition-all self-center"
        >
          <Plus size={15} />
          {language === 'th' ? 'เพิ่มประกาศใหม่' : 'Create Publication'}
        </button>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* Search / Sort / Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-gray-150">
        
        {/* Search Input */}
        <div className="sm:col-span-4 relative">
          <Search size={15} className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder={language === 'th' ? 'ค้นหาตามชื่อประกาศ...' : 'Search by title...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-bu-blue"
          />
        </div>

        {/* Filter Status */}
        <div className="sm:col-span-3 flex items-center gap-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0 px-2">Show</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-xs font-semibold focus:outline-none text-gray-700"
          >
            <option value="all">{language === 'th' ? 'ทั้งหมด (All Stages)' : 'All announcements'}</option>
            <option value="published">{language === 'th' ? 'เฉพาะที่เผยแพร่' : 'Only Published'}</option>
            <option value="unpublished">{language === 'th' ? 'เฉพาะฉบับร่าง' : 'Only Drafts'}</option>
          </select>
        </div>

        {/* Sort Column */}
        <div className="sm:col-span-3 flex items-center gap-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0 px-2">Order</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-xs font-semibold focus:outline-none text-gray-700"
          >
            <option value="sortOrder">{language === 'th' ? 'ลำดับแสดงผล' : 'Sort Order Value'}</option>
            <option value="createdAt">{language === 'th' ? 'วันที่สร้าง' : 'Created Date'}</option>
            <option value="updatedAt">{language === 'th' ? 'วันที่แก้ไขล่าสุด' : 'Last Updated'}</option>
          </select>
        </div>

        {/* Sort Direction Toggle */}
        <div className="sm:col-span-2">
          <button
            onClick={() => {
              setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
              setPage(1);
            }}
            className="w-full hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            {sortDir === 'asc' ? 'Ascending (▲)' : 'Descending (▼)'}
          </button>
        </div>

      </div>

      {/* Announcements Table */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <AppTable 
            columns={columns} 
            data={paginatedAnnouncements} 
            keyExtractor={(row) => row.id!} 
            emptyState={<AppEmptyState />}
          />
        </div>

        {/* Pagination Controls */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between bg-white px-5 py-3 border rounded-xl">
            <span className="text-xs text-gray-500 font-semibold font-mono">
              Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, filteredAnnouncements.length)} of {filteredAnnouncements.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs font-bold border rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: pageCount }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold border rounded-lg cursor-pointer ${
                    page === idx + 1 ? 'bg-bu-blue text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs font-bold border rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL PREVIEW DRAWER / MODAL DIALOG */}
      {viewingAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-2xs animate-fade-in">
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setViewingAnn(null)} 
          />
          <div className="bg-white rounded-2xl border max-w-2xl w-full max-h-[85vh] overflow-y-auto relative p-6 space-y-6 shadow-2xl animate-scale-up">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div className="space-y-1 text-left">
                <span className="inline-block bg-bu-blue/10 text-bu-blue text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                  {viewingAnn.isPublished ? 'Published' : 'Draft'}
                </span>
                <h3 className="text-lg font-black text-gray-900 pr-8">{language === 'th' ? viewingAnn.titleTH : viewingAnn.titleEN}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium font-mono pt-1">
                  <span className="flex items-center gap-1"><Layers size={13} /> {viewingAnn.id}</span>
                  <span className="flex items-center gap-1"><TrendingUp size={13} /> Sort: {viewingAnn.sortOrder}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setViewingAnn(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold p-1 bg-gray-50 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Featured Image if present */}
            {viewingAnn.featuredImage && (
              <div className="rounded-xl overflow-hidden border">
                <img src={viewingAnn.featuredImage} alt="Cover" className="w-full max-h-[220px] object-cover" />
              </div>
            )}

            {/* Formatted body text HTML render */}
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-left">
                  {language === 'th' ? 'เนื้อหาประกาศ (TH)' : 'Publication Content (TH)'}
                </span>
                <div 
                  className="rich-content-rendered text-sm text-gray-700 leading-relaxed text-left border p-4 rounded-xl bg-gray-50/50"
                  dangerouslySetInnerHTML={{ __html: viewingAnn.contentTH }}
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-left">
                  {language === 'th' ? 'เนื้อหาประกาศ (EN)' : 'Publication Content (EN)'}
                </span>
                <div 
                  className="rich-content-rendered text-sm text-gray-700 leading-relaxed text-left border p-4 rounded-xl bg-gray-50/50"
                  dangerouslySetInnerHTML={{ __html: viewingAnn.contentEN }}
                />
              </div>
            </div>

            {/* Footer details */}
            <div className="border-t border-gray-100 pt-4 flex gap-4 text-[10px] text-gray-400 font-mono text-left">
              <div>Created: {viewingAnn.createdBy} at {viewingAnn.createdAt ? new Date(viewingAnn.createdAt as Date).toLocaleString() : ''}</div>
              <div>Updated: {viewingAnn.updatedBy} at {viewingAnn.updatedAt ? new Date(viewingAnn.updatedAt as Date).toLocaleString() : ''}</div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default Announcements;
