/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useRouter } from '../../routes/Router';
import { useAuth } from '../../firebase/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { AppCard } from '../../components/AppCard';
import { AppTable } from '../../components/AppTable';
import { AppBadge } from '../../components/AppBadge';
import { AppInput } from '../../components/AppInput';
import { AppSelect } from '../../components/AppSelect';
import { AppLoading } from '../../components/AppLoading';
import { AppEmptyState } from '../../components/AppEmptyState';
import { AppButton } from '../../components/AppButton';
import { companyService } from '../../services/companyService';
import { categoryService } from '../../services/categoryService';
import { auditService } from '../../services/auditService';
import { BusinessCategorySelector } from '../../components/BusinessCategorySelector';
import { companyDuplicateService } from '../../services/companyDuplicateService';
import { CompanyMaster, BusinessCategory, Company } from '../../types';
import { 
  Search, Globe, Mail, Phone, MapPin, Building2, Plus, Download, 
  Upload, Trash2, Edit3, ArrowLeft, Check, AlertTriangle, RefreshCw, 
  Eye, Sliders, Calendar, ChevronRight, CheckCircle2, XCircle, Info, 
  RefreshCcw, EyeOff, Save, ShieldAlert, ArrowUpDown, Tag
} from 'lucide-react';

export const Companies: React.FC = () => {
  const { t, language } = useTranslation();
  const { currentPath, navigate } = useRouter();
  const { user } = useAuth();
  const operatorEmail = user?.email || 'workinteg@bu.ac.th';

  // ----------------------------------------------------
  // Inner Router State
  // ----------------------------------------------------
  let view: 'list' | 'create' | 'edit' | 'detail' | 'import' = 'list';
  let companyId = '';

  if (currentPath === '/admin/companies/create') {
    view = 'create';
  } else if (currentPath === '/admin/companies/import') {
    view = 'import';
  } else if (currentPath.match(/^\/admin\/companies\/([^/]+)\/edit$/)) {
    view = 'edit';
    const match = currentPath.match(/^\/admin\/companies\/([^/]+)\/edit$/);
    companyId = match ? match[1] : '';
  } else if (currentPath.match(/^\/admin\/companies\/([^/]+)$/)) {
    const match = currentPath.match(/^\/admin\/companies\/([^/]+)$/);
    if (match && match[1] !== 'create' && match[1] !== 'import') {
      view = 'detail';
      companyId = match[1];
    }
  }

  // ----------------------------------------------------
  // Core Business Categories States
  // ----------------------------------------------------
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getAllBusinessCategories();
        setCategories(res.filter(c => c.active));
      } catch (err) {
        console.error('Failed to load active business categories', err);
      }
    };
    fetchCats();
  }, []);

  // ----------------------------------------------------
  // LIST VIEW CONTROLLER & STATES
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<'master' | 'approved'>('master');
  const [loading, setLoading] = useState(true);
  const [masterCompanies, setMasterCompanies] = useState<CompanyMaster[]>([]);
  const [legacyPartners, setLegacyPartners] = useState<Company[]>([]);
  
  // Custom Filters state
  const [keyword, setKeyword] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all'); // 'all' | 'active' | 'inactive'
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCreatedFrom, setFilterCreatedFrom] = useState('');
  const [filterCreatedTo, setFilterCreatedTo] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // default code order desc

  // Bulk operation states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Feedback Alerts / Toasts
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'err'; text: string } | null>(null);
  const triggerToast = (text: string, type: 'success' | 'err' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Real-time Master Subscription
  useEffect(() => {
    if (view !== 'list') return;
    setLoading(true);
    
    // Subscribe to master
    const unsubscribeMaster = companyService.subscribeMaster(
      (list) => {
        setMasterCompanies(list);
        setLoading(false);
      },
      (err) => {
        console.error('Subscription error on company master:', err);
        setLoading(false);
      }
    );

    // Fetch approved legacy partner matches
    const loadLegacyPartners = async () => {
      try {
        const partners = await companyService.getAll();
        setLegacyPartners(partners);
      } catch (err) {
        console.error('Failed to load legacy partner matches', err);
      }
    };
    loadLegacyPartners();

    return () => {
      unsubscribeMaster();
    };
  }, [view]);

  // Handle Search Filters locally (extremely fast rendering on client for 1,000+ companies)
  const getFilteredMasterCompanies = () => {
    let list = [...masterCompanies];

    // Status filter
    if (filterActive === 'active') {
      list = list.filter(c => c.active);
    } else if (filterActive === 'inactive') {
      list = list.filter(c => !c.active);
    }

    // Category filter
    if (filterCategory !== 'all') {
      list = list.filter(c => c.businessCategoryId === filterCategory);
    }

    // Keyword lookups
    if (keyword.trim()) {
      const kw = keyword.toLowerCase().trim();
      list = list.filter(c => 
        c.companyNameTH.toLowerCase().includes(kw) || 
        c.companyNameEN.toLowerCase().includes(kw) ||
        c.companyCode.toLowerCase().includes(kw) ||
        c.remarks.toLowerCase().includes(kw)
      );
    }

    // Date range filters
    if (filterCreatedFrom) {
      const fDate = new Date(filterCreatedFrom);
      list = list.filter(c => new Date(c.createdAt) >= fDate);
    }
    if (filterCreatedTo) {
      const tDate = new Date(filterCreatedTo);
      // set to end of day
      tDate.setHours(23, 59, 59, 999);
      list = list.filter(c => new Date(c.createdAt) <= tDate);
    }
    if (filterUpdatedFrom) {
      const fDate = new Date(filterUpdatedFrom);
      list = list.filter(c => new Date(c.updatedAt) >= fDate);
    }
    if (filterUpdatedTo) {
      const tDate = new Date(filterUpdatedTo);
      tDate.setHours(23, 59, 59, 999);
      list = list.filter(c => new Date(c.updatedAt) <= tDate);
    }

    // Sort order
    list.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.companyCode.localeCompare(a.companyCode);
      } else {
        return a.companyCode.localeCompare(b.companyCode);
      }
    });

    return list;
  };

  const filteredMaster = getFilteredMasterCompanies();

  // Export filtered master as fully-formatted CSV (UTF-8 encoded)
  const handleExportCSV = async () => {
    try {
      const exportList = filteredMaster;
      if (exportList.length === 0) {
        triggerToast(language === 'th' ? 'ไม่มีข้อมูลสำหรับส่งออก' : 'No master data to export', 'err');
        return;
      }

      // Headers Row
      const headers = [
        'Company Code', 'Company Name TH', 'Company Name EN', 
        'Website', 'Status', 'Category Code', 'Category Name TH', 
        'Category Name EN', 'Source', 'Remarks', 'Created At', 'Updated At'
      ].join(',');

      // Map rows safely escaping quotes
      const csvRows = exportList.map(c => {
        const escape = (val: string | null | undefined) => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        };

        return [
          escape(c.companyCode),
          escape(c.companyNameTH),
          escape(c.companyNameEN),
          escape(c.website),
          escape(c.active ? 'Active' : 'Inactive'),
          escape(c.businessCategoryId || 'N/A'),
          escape(c.businessCategoryNameTH || 'N/A'),
          escape(c.businessCategoryNameEN || 'N/A'),
          escape(c.source),
          escape(c.remarks),
          escape(new Date(c.createdAt).toLocaleDateString('en-US')),
          escape(new Date(c.updatedAt).toLocaleDateString('en-US'))
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers, ...csvRows].join('\n'); // Add UTF-8 BOM
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BU_JobFair_CompanyMaster_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Audit Log
      await auditService.logAction(
        'Export Companies CSV',
        operatorEmail,
        'multiple',
        'CompanyMaster',
        `Exported ${exportList.length} filtered companies to CSV file.`
      );

      triggerToast(
        language === 'th' ? `ส่งออกสำเร็จ (${exportList.length} บริษัท)` : `Exported successfully (${exportList.length} companies)`
      );
    } catch (err) {
      console.error('Failed to export CSV', err);
      triggerToast(language === 'th' ? 'เกิดข้อผิดพลาดในการส่งออกไฟล์' : 'Error generating exported CSV file', 'err');
    }
  };

  // Bulk Actions
  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await companyService.updateMaster(id, { active: true }, operatorEmail);
      }
      await auditService.logAction(
        'Activate Selected Master Companies',
        operatorEmail,
        'multiple',
        'CompanyMaster',
        `Bulk activated status for ${selectedIds.length} candidate IDs: ${selectedIds.join(', ')}`
      );
      setSelectedIds([]);
      triggerToast(language === 'th' ? 'เปิดใช้งานบริษัทที่เลือกเรียบร้อย' : 'Activated selected companies');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await companyService.updateMaster(id, { active: false }, operatorEmail);
      }
      await auditService.logAction(
        'Deactivate Selected Master Companies',
        operatorEmail,
        'multiple',
        'CompanyMaster',
        `Bulk deactivated status (soft deleted) for ${selectedIds.length} candidate IDs: ${selectedIds.join(', ')}`
      );
      setSelectedIds([]);
      triggerToast(language === 'th' ? 'ปิดใช้งานบริษัทที่เลือกเรียบร้อย' : 'Deactivated selected companies');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Single Actions
  const handleSoftDelete = async (id: string, name: string) => {
    if (!window.confirm(language === 'th' 
      ? `ต้องการปิดใช้งาน (Soft Delete) บริษัท "${name}" หรือไม่?\n(ข้อมูลจะไม่สูญหายและสามารถเปิดใช้งานใหม่ได้ทุกเมื่อ)` 
      : `Are you sure you want to lock/deactivate "${name}"?`)) return;
    
    try {
      setLoading(true);
      await companyService.deleteMaster(id, operatorEmail);
      await auditService.logAction(
        'Soft Delete Company',
        operatorEmail,
        id,
        'CompanyMaster',
        `Soft deleted G-Master record for "${name}" (active set to false)`
      );
      triggerToast(language === 'th' ? `ปิดใช้งานบริษัท "${name}" เรียบร้อย` : `Locked de-activated "${name}"`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      setLoading(true);
      await companyService.restoreMaster(id, operatorEmail);
      await auditService.logAction(
        'Restore Company',
        operatorEmail,
        id,
        'CompanyMaster',
        `Restored active status for "${name}"`
      );
      triggerToast(language === 'th' ? `กู้คืนสถานะบริษัท "${name}" เรียบร้อย` : `Restored active status for "${name}"`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // ----------------------------------------------------
  // FORM COMPONENT FOR CREATE / EDIT
  // ----------------------------------------------------
  const FormView: React.FC<{ mode: 'create' | 'edit'; id?: string }> = ({ mode, id }) => {
    const [saving, setSaving] = useState(false);
    const [formState, setFormState] = useState({
      companyNameTH: '',
      companyNameEN: '',
      businessCategoryId: '',
      website: '',
      active: true,
      remarks: ''
    });

    // Form duplicate check storage
    const [duplicateWarning, setDuplicateWarning] = useState<{
      open: boolean;
      th: boolean;
      en: boolean;
    }>({ open: false, th: false, en: false });

    // Load existing editing data
    useEffect(() => {
      if (mode === 'edit' && id) {
        const fetchMaster = async () => {
          setSaving(true);
          const comp = await companyService.getMasterById(id);
          if (comp) {
            setFormState({
              companyNameTH: comp.companyNameTH,
              companyNameEN: comp.companyNameEN,
              businessCategoryId: comp.businessCategoryId || '',
              website: comp.website,
              active: comp.active,
              remarks: comp.remarks
            });
          }
          setSaving(false);
        };
        fetchMaster();
      }
    }, [mode, id]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formState.companyNameTH.trim() || !formState.companyNameEN.trim()) {
        triggerToast(language === 'th' ? 'กรุณากรอกชื่อบริษัททั้งภาษาไทยและอังกฤษ' : 'Please input names in both Thai and English', 'err');
        return;
      }

      setSaving(true);
      try {
        // Trigger duplicate search helper
        const dupResult = await companyDuplicateService.checkDuplicate(
          formState.companyNameTH,
          formState.companyNameEN,
          id // exclude current id in edit checks
        );

        if (dupResult.duplicateTH || dupResult.duplicateEN) {
          setDuplicateWarning({
            open: true,
            th: dupResult.duplicateTH,
            en: dupResult.duplicateEN
          });
          setSaving(false);
          return;
        }

        await processSave();
      } catch (err) {
        console.error(err);
        setSaving(false);
      }
    };

    const processSave = async () => {
      setSaving(true);
      try {
        // Find Category names TH/EN helper
        const selectedCat = categories.find(c => c.id === formState.businessCategoryId);
        const catNameTH = selectedCat ? selectedCat.categoryNameTH : null;
        const catNameEN = selectedCat ? selectedCat.categoryNameEN : null;

        const payload = {
          companyNameTH: formState.companyNameTH.trim(),
          companyNameEN: formState.companyNameEN.trim(),
          businessCategoryId: formState.businessCategoryId || null,
          businessCategoryNameTH: catNameTH,
          businessCategoryNameEN: catNameEN,
          website: formState.website.trim(),
          active: formState.active,
          source: mode === 'create' ? 'manual' : (id ? 'manual' : 'manual'),
          remarks: formState.remarks.trim()
        };

        if (mode === 'create') {
          const resp = await companyService.createMaster(payload, operatorEmail);
          await auditService.logAction(
            'Create Company',
            operatorEmail,
            resp.id || 'unknown',
            'CompanyMaster',
            `Manually registered corporate master item "${payload.companyNameEN}" (${payload.companyNameTH})`
          );
          triggerToast(language === 'th' ? 'เพิ่มสถานประกอบการ Master เรียบร้อย' : 'Created company master successfully');
        } else if (mode === 'edit' && id) {
          await companyService.updateMaster(id, payload, operatorEmail);
          await auditService.logAction(
            'Update Company',
            operatorEmail,
            id,
            'CompanyMaster',
            `Modified corporate details for "${payload.companyNameEN}". Upgraded remarks and settings.`
          );
          triggerToast(language === 'th' ? 'แก้ไขข้อมูลเสร็จเรียบร้อย' : 'Updated company details successfully');
        }

        navigate('/admin/companies');
      } catch (err) {
        console.error('Save failed', err);
        triggerToast(language === 'th' ? 'ไม่สามารถบันทึกข้อมูลได้' : 'Failed to save company', 'err');
      } finally {
        setSaving(false);
      }
    };

    if (saving && mode === 'edit' && formState.companyNameTH === '') {
      return <AppLoading text="Loading detailed form..." />;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <AppButton 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/companies')}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            {language === 'th' ? 'ย้อนกลับ' : 'Back'}
          </AppButton>
          <PageHeader 
            title={mode === 'create' 
              ? (language === 'th' ? 'เพิ่มสถานประกอบการ Master' : 'Add Master Company')
              : (language === 'th' ? 'แก้ไขข้อมูลสถานประกอบการ' : 'Edit Master Company')}
            description={language === 'th' 
              ? 'บันทึกฐานข้อมูลเพื่อใช้ในการค้นหาและประมวลผลระบบฟอร์มลงทะเบียน' 
              : 'Add corporate data points onto Firestore Master collection.'}
          />
        </div>

        {/* Form panel */}
        <AppCard className="p-6 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {language === 'th' ? 'ชื่อสถานประกอบการ (ภาษาไทย)' : 'Company Name (TH)'} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formState.companyNameTH}
                  onChange={e => setFormState(f => ({ ...f, companyNameTH: e.target.value }))}
                  placeholder="เช่น บริษัท อาร์ต แอนด์ มีเดีย จำกัด"
                  className="w-full rounded-lg border border-gray-350 px-3.5 py-2.5 text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-bu-blue/20 focus:border-bu-blue focus:outline-none transition-all shadow-3xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {language === 'th' ? 'ชื่อสถานประกอบการ (ภาษาอังกฤษ)' : 'Company Name (EN)'} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formState.companyNameEN}
                  onChange={e => setFormState(f => ({ ...f, companyNameEN: e.target.value }))}
                  placeholder="e.g. Art and Media Co., Ltd."
                  className="w-full rounded-lg border border-gray-350 px-3.5 py-2.5 text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-bu-blue/20 focus:border-bu-blue focus:outline-none transition-all shadow-3xs"
                />
              </div>

              <div className="space-y-2 select-none col-span-1 md:col-span-2">
                <BusinessCategorySelector
                  selectedId={formState.businessCategoryId}
                  onChange={(id) => setFormState(f => ({ ...f, businessCategoryId: id || '' }))}
                  labelClassName="font-bold text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {language === 'th' ? 'ที่อยู่อีเมลหรือลิงก์เว็บไซต์' : 'Corporate Website URL'}
                </label>
                <input 
                  type="text"
                  value={formState.website}
                  onChange={e => setFormState(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-gray-350 px-3.5 py-2.5 text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-bu-blue/20 focus:border-bu-blue focus:outline-none transition-all shadow-3xs"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {language === 'th' ? 'หมายเหตุ / รายละเอียดเพิ่มเติม' : 'Remarks / Supplementary details'}
                </label>
                <textarea 
                  rows={3}
                  value={formState.remarks}
                  onChange={e => setFormState(f => ({ ...f, remarks: e.target.value }))}
                  placeholder="กรอกรายละเอียดติดต่อเพิ่มเติม หรือประวัติความร่วมมือสั้นๆ"
                  className="w-full rounded-lg border border-gray-350 px-3.5 py-2.5 text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-bu-blue/20 focus:border-bu-blue focus:outline-none transition-all shadow-3xs"
                />
              </div>

              <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl flex items-center justify-between md:col-span-2">
                <div>
                  <h4 className="text-sm font-extrabold text-gray-800">
                    {language === 'th' ? 'สถานะเอกสารประพฤติศีลธรรม (Active Status)' : 'Corporate Active Status'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {language === 'th' ? 'หากยกเลิก จะไม่แสดงผลในแบบฟอร์มลงทะเบียนจับคู่' : 'Inactive companies will not appear as suggestions in registration filters.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formState.active}
                    onChange={e => setFormState(f => ({ ...f, active: e.target.checked }))}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bu-blue"></div>
                </label>
              </div>

            </div>

            <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-3">
              <AppButton 
                type="button" 
                variant="outline"
                onClick={() => navigate('/admin/companies')}
                disabled={saving}
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </AppButton>
              <AppButton 
                type="submit" 
                variant="primary"
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {language === 'th' ? 'บันทึกข้อมูล' : 'Save Company'}
              </AppButton>
            </div>
          </form>
        </AppCard>

        {/* Duplicate warning Modal */}
        {duplicateWarning.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden animate-zoom-in">
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-rose-700">
                    {language === 'th' ? 'ตรวจพบข้อมูลซ้ำซ้อน!' : 'Duplicate Corporate Detected'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {language === 'th' 
                      ? 'พบรายชื่อสถานประกอบการต่อไปนี้ซ้ำในฐานข้อมูล:' 
                      : 'These company naming variations are closely similar to existing master records:'}
                  </p>
                  
                  <div className="mt-3 py-2 px-4 bg-rose-50 text-rose-750 text-xs rounded-xl font-bold space-y-1 block text-left">
                    {duplicateWarning.th && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                        {language === 'th' ? 'ชื่อภาษาไทยซ้ำ' : 'Thai Name duplicate match'}
                      </div>
                    )}
                    {duplicateWarning.en && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                        {language === 'th' ? 'ชื่อภาษาอังกฤษซ้ำ' : 'English Name duplicate match'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() => setDuplicateWarning(w => ({ ...w, open: false }))}
                >
                  {language === 'th' ? 'กลับไปแก้ไข' : 'Go back and edit'}
                </AppButton>
                <AppButton
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    setDuplicateWarning(w => ({ ...w, open: false }));
                    await processSave();
                  }}
                >
                  {language === 'th' ? 'ยืนยันบันทึกซ้ำต่อไป' : 'Force Save anyway'}
                </AppButton>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  // ----------------------------------------------------
  // DETAIL VIEW COMPONENT
  // ----------------------------------------------------
  const DetailView: React.FC<{ id: string }> = ({ id }) => {
    const [comp, setComp] = useState<CompanyMaster | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(true);

    useEffect(() => {
      const getDetail = async () => {
        setLoadingDetail(true);
        const res = await companyService.getMasterById(id);
        if (res) {
          setComp(res);
        }
        setLoadingDetail(false);
      };
      getDetail();
    }, [id]);

    if (loadingDetail) return <AppLoading text="Fetching detailed info..." />;
    if (!comp) {
      return (
        <div className="p-8 text-center space-y-3">
          <Info className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-500">{language === 'th' ? 'ไม่พบข้อมูลที่ต้องการ' : 'Company not found'}</h3>
          <AppButton onClick={() => navigate('/admin/companies')}>{language === 'th' ? 'ย้อนกลับ' : 'Back to List'}</AppButton>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppButton 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/companies')}
              className="flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              {language === 'th' ? 'ย้อนกลับ' : 'Back'}
            </AppButton>
            <PageHeader 
              title={language === 'th' ? 'ข้อมูลสถานประกอบการแบบละเอียด' : 'Master Corporate Profile'}
              description={language === 'th' ? 'ประวัติประวัติและข้อมูลเชื่อมโยงหมวดหมู่ระบบลงทะเบียน' : 'Complete details of Firestore registered corporate records.'}
            />
          </div>
          <AppButton 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/admin/companies/${id}/edit`)}
            className="flex items-center gap-1.5"
          >
            <Edit3 size={14} />
            {language === 'th' ? 'แก้ไขข้อมูล' : 'Edit Company'}
          </AppButton>
        </div>

        <AppCard className="p-6 max-w-4xl space-y-6">
          {/* Header Code and active state */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-150 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm bg-bu-blue/10 border border-bu-blue/20 text-bu-blue font-mono font-black px-3 py-1.5 rounded-lg shrink-0">
                {comp.companyCode}
              </span>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {language === 'th' ? comp.companyNameTH : comp.companyNameEN}
              </h2>
            </div>
            
            <AppBadge 
              variant={comp.active ? 'success' : 'neutral'}
              label={comp.active 
                ? (language === 'th' ? 'พร้อมให้บริการ' : 'Active') 
                : (language === 'th' ? 'ระงับบริการ' : 'Inactive')}
            />
          </div>

          {/* Details info-grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <div className="space-y-1">
              <span className="block text-gray-400 font-semibold">{language === 'th' ? 'ชื่อสมาคม/บริษัท (ภาษาไทย)' : 'Thai Official Name'}</span>
              <p className="font-bold text-gray-800">{comp.companyNameTH}</p>
            </div>

            <div className="space-y-1">
              <span className="block text-gray-400 font-semibold">{language === 'th' ? 'ชื่อสมาคม/บริษัท (ภาษาอังกฤษ)' : 'English Partner Name'}</span>
              <p className="font-bold text-gray-800">{comp.companyNameEN}</p>
            </div>

            <div className="space-y-1">
              <span className="block text-gray-400 font-semibold">{language === 'th' ? 'กลุ่มประเภททางอุตสาหกรรม' : 'Business Sector Category'}</span>
              <div className="flex items-center gap-1 text-gray-800 mt-1">
                <Tag size={13} className="text-bu-blue" />
                <p className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                  {comp.businessCategoryId 
                    ? (language === 'th' ? (comp.businessCategoryNameTH || comp.businessCategoryId) : (comp.businessCategoryNameEN || comp.businessCategoryId))
                    : <span className="text-gray-450 font-normal italic">{language === 'th' ? 'ไม่ระบุ' : 'N/A'}</span>}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-gray-400 font-semibold">{language === 'th' ? 'สมาคม/ลิงก์เว็บไซต์' : 'Website Connection'}</span>
              {comp.website ? (
                <a 
                  href={comp.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 text-bu-bright font-bold hover:underline"
                >
                  <Globe size={14} />
                  {comp.website}
                </a>
              ) : <span className="text-gray-400 italic font-medium">{language === 'th' ? 'ไม่ได้ระบุที่อยู่เว็บไซต์' : 'No web specified'}</span>}
            </div>

            <div className="space-y-1">
              <span className="block text-gray-400 font-semibold">{language === 'th' ? 'แหล่งที่มาของข้อมูล' : 'Origin / Source'}</span>
              <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-xs uppercase font-mono">
                {comp.source || 'manual'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="block text-gray-400 font-semibold">{language === 'th' ? 'แก้ไขล่าสุดเมื่อ' : 'Latest activity logs'}</span>
              <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                <Calendar size={14} />
                <span>{new Date(comp.updatedAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</span>
                <span>•</span>
                <span className="text-gray-400 font-mono text-xs">{comp.updatedBy}</span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1 border-t border-gray-100 pt-4">
              <span className="block text-gray-400 font-semibold">{language === 'th' ? 'คำแนะนำเพิ่มเติม / หมายเหตุ' : 'Admin remarks / note comments'}</span>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-xl font-medium border border-gray-150/50 leading-relaxed whitespace-pre-wrap">
                {comp.remarks || (language === 'th' ? 'ไม่มีบันทึกข้อความเสริมสำหรับบริษัทนี้' : 'No supplementary comments mapped.')}
              </p>
            </div>
          </div>
        </AppCard>
      </div>
    );
  };


  // ----------------------------------------------------
  // CSV IMPORT VIEW WORKSPACE / PREVIEW
  // ----------------------------------------------------
  const CSVImportView: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileUploaded, setFileUploaded] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    
    // Parsed candidates preview state
    const [parsedData, setParsedData] = useState<{
      thaiName: string;
      engName: string;
      website: string;
      remarks: string;
      categoryCode: string;
      status: 'valid' | 'duplicate_warning' | 'error';
      reason?: string;
    }[]>([]);

    const dragOverHandler = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const dropHandler = (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileTrigger(e.dataTransfer.files[0]);
      }
    };

    const handleFileTrigger = (file: File) => {
      if (!file.name.endsWith('.csv')) {
        triggerToast(language === 'th' ? 'กรุณาอัปโหลดไฟล์สกุล .csv เท่านั้น' : 'Please upload only CSV files', 'err');
        return;
      }
      setFileUploaded(file);
      processCSVContent(file);
    };

    // Parse UTF-8 text and validation
    const processCSVContent = async (file: File) => {
      setImportLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const text = e.target?.result as string;
            
            // RFC-Compliant custom parser
            const rows = parseCSVContentText(text);
            if (rows.length <= 1) {
              triggerToast(language === 'th' ? 'ไฟล์ว่างเปล่าหรือไม่ถูกต้อง' : 'Empty or corrupt CSV sheet', 'err');
              setImportLoading(false);
              return;
            }

            // Read header
            const headers = rows[0].map(h => h.trim().toLowerCase());
            
            // Determine structural indexes
            // Look for keywords
            const findIdx = (keywords: string[]) => {
              return headers.findIndex(h => keywords.some(k => h.includes(k)));
            };

            const thIdx = findIdx(['th', 'ไทย', 'name_th', 'th_name']);
            const enIdx = findIdx(['en', 'อังกฤษ', 'name_en', 'en_name']);
            const webIdx = findIdx(['web', 'ลิงก์', 'url', 'site']);
            const remarkIdx = findIdx(['remark', 'note', 'หมายเหตุ', 'remarks']);
            const catIdx = findIdx(['cat', 'กลุ่ม', 'category', 'category_code', 'code']);

            if (thIdx === -1 || enIdx === -1) {
              triggerToast(
                language === 'th' 
                  ? 'กรุณาระบุหัวคอลัมน์ชื่อบริษัทภาษาไทยและภาษาอังกฤษให้ถูกต้อง' 
                  : 'CSV must contain columns with "TH Naming" and "EN Naming"', 
                'err'
              );
              setImportLoading(false);
              return;
            }

            // Get existing companies for lookup warnings
            const currentCompanies = await companyService.getAllMasterRaw();

            // Loop and parse candidates
            const parsedResults: typeof parsedData = [];
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (row.length < 2) continue; // Skip lines

              const nameTH = row[thIdx] ? row[thIdx].trim() : '';
              const nameEN = row[enIdx] ? row[enIdx].trim() : '';
              const website = webIdx !== -1 && row[webIdx] ? row[webIdx].trim() : '';
              const remarks = remarkIdx !== -1 && row[remarkIdx] ? row[remarkIdx].trim() : '';
              const categoryCode = catIdx !== -1 && row[catIdx] ? row[catIdx].trim() : '';

              if (!nameTH || !nameEN) {
                parsedResults.push({
                  thaiName: nameTH,
                  engName: nameEN,
                  website,
                  remarks,
                  categoryCode,
                  status: 'error',
                  reason: language === 'th' ? 'ไม่มีชื่อภาษาไทยหรืออังกฤษ' : 'Empty Thai/English Naming fields'
                });
                continue;
              }

              // Check for exact duplicate in loaded master state
              const dupTH = currentCompanies.some(c => c.companyNameTH.trim().toLowerCase() === nameTH.toLowerCase());
              const dupEN = currentCompanies.some(c => c.companyNameEN.trim().toLowerCase() === nameEN.toLowerCase());

              if (dupTH || dupEN) {
                parsedResults.push({
                  thaiName: nameTH,
                  engName: nameEN,
                  website,
                  remarks,
                  categoryCode,
                  status: 'duplicate_warning',
                  reason: language === 'th' ? 'พบชื่อซ้ำซ้อนในฐานข้อมูลหลัก' : 'Matches existing Firestore master record'
                });
              } else {
                parsedResults.push({
                  thaiName: nameTH,
                  engName: nameEN,
                  website,
                  remarks,
                  categoryCode,
                  status: 'valid'
                });
              }
            }

            setParsedData(parsedResults);
          } catch (err) {
            console.error(err);
            triggerToast(language === 'th' ? 'เกิดข้อผิดพลาดในการประมวลผลไฟล์' : 'CSV parsing failed', 'err');
          } finally {
            setImportLoading(false);
          }
        };

        reader.readAsText(file, 'UTF-8');
      } catch (err) {
        console.error(err);
        setImportLoading(false);
      }
    };

    // Custom CSV parser
    const parseCSVContentText = (text: string): string[][] => {
      const lines: string[][] = [];
      let row: string[] = [];
      let inQuotes = false;
      let entry = '';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            entry += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(entry.trim());
          entry = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          row.push(entry.trim());
          if (row.length > 1 || row[0] !== '') {
            lines.push(row);
          }
          row = [];
          entry = '';
        } else {
          entry += char;
        }
      }

      if (row.length > 0 || entry !== '') {
        row.push(entry.trim());
        lines.push(row);
      }

      return lines;
    };

    // Commit import task loops
    const handleCommitImport = async () => {
      const uploadable = parsedData.filter(p => p.status === 'valid' || p.status === 'duplicate_warning');
      if (uploadable.length === 0) {
        triggerToast(language === 'th' ? 'ไม่มีบริษัทที่ถูกต้องสำหรับอัปโหลดข้อมูล' : 'No valid companies to upload', 'err');
        return;
      }

      setImportLoading(true);
      try {
        let successCount = 0;
        
        for (const item of uploadable) {
          // Attempt to map category code to active category IDs
          const matchedCategory = categories.find(c => 
            c.categoryCode.toLowerCase() === item.categoryCode.toLowerCase() ||
            c.categoryNameEN.toLowerCase().includes(item.categoryCode.toLowerCase()) ||
            c.categoryNameTH.includes(item.categoryCode)
          );

          await companyService.createMaster({
            companyNameTH: item.thaiName,
            companyNameEN: item.engName,
            businessCategoryId: matchedCategory ? matchedCategory.id! : null,
            businessCategoryNameTH: matchedCategory ? matchedCategory.categoryNameTH : null,
            businessCategoryNameEN: matchedCategory ? matchedCategory.categoryNameEN : null,
            website: item.website,
            active: true,
            source: 'csv',
            remarks: item.remarks || 'Imported via CSV file uploading'
          }, operatorEmail);

          successCount++;
        }

        // Write audit log entry
        await auditService.logAction(
          'Import Companies CSV',
          operatorEmail,
          'multiple',
          'CompanyMaster',
          `Parsed and imported CSV sheet: "${fileUploaded?.name}". Uploaded ${successCount} entries into Master dataset.`
        );

        triggerToast(
          language === 'th' 
            ? `นำเข้าข้อมูลเสร็จสิ้นเรียบร้อยแล้ว (${successCount} รายการ)` 
            : `Completed CSV onboarding flow safely! (${successCount} companies merged)`
        );

        navigate('/admin/companies');
      } catch (err) {
        console.error('Import commitment error:', err);
        triggerToast(language === 'th' ? 'ดำเนินการอัปโหลดข้อมูลล้มเหลว' : 'Failed uploading onboarding entries', 'err');
      } finally {
        setImportLoading(false);
      }
    };

    const clearCSVWorkspace = () => {
      setFileUploaded(null);
      setParsedData([]);
    };

    const validCount = parsedData.filter(d => d.status === 'valid').length;
    const warningCount = parsedData.filter(d => d.status === 'duplicate_warning').length;
    const errorCount = parsedData.filter(d => d.status === 'error').length;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <AppButton 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/admin/companies')}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            {language === 'th' ? 'ย้อนกลับ' : 'Back'}
          </AppButton>
          <PageHeader 
            title={language === 'th' ? 'ระบบนำข้อมูลเข้าจาก CSV' : 'Bulk CSV Import'}
            description={language === 'th' ? 'นำเข้ารายการบริษัทจำนวนมากด้วยไฟล์ UTF-8 สเปรดชีตอย่างรวดเร็ว' : 'Upload and onboard hundreds of master companies safely.'}
          />
        </div>

        {/* Workspace Card */}
        {importLoading && parsedData.length === 0 ? (
          <AppLoading text="Decoding UTF-8 CSV content and checking duplicate names on Firestore..." />
        ) : !fileUploaded ? (
          <AppCard className="p-8 max-w-4xl text-center">
            <div 
              onDragOver={dragOverHandler}
              onDrop={dropHandler}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-bu-blue bg-gray-50/50 hover:bg-bu-blue/5 p-12 rounded-2xl cursor-pointer transition-all space-y-4 group"
            >
              <div className="w-16 h-16 rounded-full bg-white text-gray-450 border border-gray-200 group-hover:text-bu-blue group-hover:border-bu-blue/30 shadow-3xs flex items-center justify-center mx-auto transition-all">
                <Upload size={28} className="animate-bounce" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-gray-800">
                  {language === 'th' ? 'คลิกหรือลากไฟล์ .CSV วางที่นี่' : 'Click to select or drag and drop files here'}
                </p>
                <p className="text-xs text-gray-400">
                  {language === 'th' ? 'ต้องใช้ไฟล์เข้ารหัสอักขระแบบ UTF-8 เท่านั้น' : 'UTF-8 encoded comma separated sheets recommended'}
                </p>
              </div>
              
              <div className="pt-2 max-w-xs mx-auto text-[10px] text-gray-400 block font-semibold hover:underline">
                {language === 'th' ? 'ดาวน์โหลดตัวอย่างไฟล์สเปรดชีต CSV' : 'Download sample template.csv'}
              </div>

              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv" 
                onChange={e => e.target.files?.[0] && handleFileTrigger(e.target.files[0])}
                className="hidden" 
              />
            </div>
          </AppCard>
        ) : (
          <div className="space-y-6">
            {/* Status Statistics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4 flex items-center gap-3 shadow-3xs">
                <div className="p-2.5 rounded-lg bg-gray-100 text-gray-500 shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase">{language === 'th' ? 'จำนวนนำเข้าทั้งหมด' : 'Uploaded total'}</span>
                  <span className="text-lg font-mono font-black text-gray-800">{parsedData.length}</span>
                </div>
              </div>

              <div className="bg-white border border-emerald-100 p-4 rounded-xl flex items-center gap-3 shadow-3xs">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase">{language === 'th' ? 'ข้อมูลพร้อมนำเข้า' : 'Ready to Onboard'}</span>
                  <span className="text-lg font-mono font-black text-emerald-600">{validCount}</span>
                </div>
              </div>

              <div className="bg-white border border-amber-100 p-4 rounded-xl flex items-center gap-3 shadow-3xs">
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase">{language === 'th' ? 'คำเตือนพบประวัติซ้ำ' : 'Double warnings'}</span>
                  <span className="text-lg font-mono font-black text-amber-600">{warningCount}</span>
                </div>
              </div>

              <div className="bg-white border border-rose-100 p-4 rounded-xl flex items-center gap-3 shadow-3xs">
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                  <XCircle size={20} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase">{language === 'th' ? 'ข้อผิดพลาดข้ามรายการ' : 'Invalid Errors'}</span>
                  <span className="text-lg font-mono font-black text-rose-600">{errorCount}</span>
                </div>
              </div>
            </div>

            {/* Preview Candidates list */}
            <AppCard className="p-4" title={language === 'th' ? 'พรีวิวขั้นตอนวิเคราะห์ข้อมูลก่อนเซฟจริง' : 'CSV Upload Workspace Validation Preview'}>
              <div className="max-h-96 overflow-y-auto border rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-gray-50 border-b text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">{language === 'th' ? 'ชื่อสมาคม/บริษัท (ไทย)' : 'Thai Naming'}</th>
                      <th className="px-4 py-3">{language === 'th' ? 'ชื่อสมาคม/บริษัท (อังกฤษ)' : 'English Naming'}</th>
                      <th className="px-4 py-3">{language === 'th' ? 'กลุ่มอุตสาหกรรม' : 'Category Category'}</th>
                      <th className="px-4 py-3">Website</th>
                      <th className="px-4 py-3">{language === 'th' ? 'สถานะตรวจสอบ' : 'Analysis status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-gray-700">
                    {parsedData.map((d, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 max-w-xs truncate font-bold">{d.thaiName || <span className="text-red-400 italic">Name empty</span>}</td>
                        <td className="px-4 py-3 max-w-xs truncate">{d.engName || <span className="text-red-400 italic">Name empty</span>}</td>
                        <td className="px-4 py-3 font-mono text-xs">{d.categoryCode || <span className="text-gray-400 italic">None</span>}</td>
                        <td className="px-4 py-3 truncate max-w-xs">{d.website || <span className="text-gray-300">-</span>}</td>
                        <td className="px-4 py-3">
                          {d.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                              <Check size={12} /> Ready
                            </span>
                          )}
                          {d.status === 'duplicate_warning' && (
                            <span 
                              title={d.reason}
                              className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full cursor-help"
                            >
                              <AlertTriangle size={12} /> Match Found
                            </span>
                          )}
                          {d.status === 'error' && (
                            <span 
                              title={d.reason}
                              className="inline-flex items-center gap-1 text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full cursor-help"
                            >
                              <XCircle size={12} /> Blocked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Warning message footer */}
              {warningCount > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 flex gap-2 text-xs font-bold block">
                  <AlertTriangle className="shrink-0 h-4.5 w-4.5 text-amber-600" />
                  <div>
                    <p>{language === 'th' ? `ตรวจพบชื่อสมาคมที่อาจมีการเซฟประวัติซ้ำกับฐานข้อมูลหลักใน Firestore จำนวน ${warningCount} รายการ` : `Found ${warningCount} entries that closely resemble existing Firestore entries.`}</p>
                    <p className="font-normal text-amber-600 mt-0.5">{language === 'th' ? 'หากเซฟต่อ ระบบจะสร้างรหัส Code ใหม่และอนุญาตให้เข้าข้อมูลคู่กันได้' : 'Proceeding with the import will grant them dedicated Codes alongside the originals.'}</p>
                  </div>
                </div>
              )}

              {/* Footer controls */}
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <AppButton 
                  variant="outline"
                  onClick={clearCSVWorkspace}
                  disabled={importLoading}
                  className="flex items-center gap-1"
                >
                  <RefreshCcw size={14} />
                  {language === 'th' ? 'เลือกไฟล์ใหม่' : 'Clear & Re-Upload'}
                </AppButton>
                
                <div className="flex items-center gap-3">
                  <AppButton 
                    variant="outline"
                    onClick={() => navigate('/admin/companies')}
                    disabled={importLoading}
                  >
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </AppButton>
                  <AppButton 
                    variant="primary"
                    disabled={importLoading || (validCount + warningCount === 0)}
                    onClick={handleCommitImport}
                    className="flex items-center gap-2"
                  >
                    {importLoading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {language === 'th' ? `ดำเนินการนำเข้ารายชื่อทั้งหมด (${validCount + warningCount})` : `Commit merging data (${validCount + warningCount})`}
                  </AppButton>
                </div>
              </div>
            </AppCard>
          </div>
        )}
      </div>
    );
  };


  // ----------------------------------------------------
  // MAIN ROUTER VIEW REDIRECTOR
  // ----------------------------------------------------
  if (view === 'create') {
    return <FormView mode="create" />;
  }

  if (view === 'edit') {
    return <FormView mode="edit" id={companyId} />;
  }

  if (view === 'detail') {
    return <DetailView id={companyId} />;
  }

  if (view === 'import') {
    return <CSVImportView />;
  }


  // ----------------------------------------------------
  // BASE LIST VIEW (DEFAULT)
  // ----------------------------------------------------
  const columnsMaster = [
    {
      key: 'select',
      header: (
        <input 
          type="checkbox" 
          checked={getFilteredMasterCompanies().length > 0 && selectedIds.length === getFilteredMasterCompanies().filter(c => c.id).length}
          onChange={e => {
            if (e.target.checked) {
              const allFilteredIds = getFilteredMasterCompanies()
                .filter(c => c.id)
                .map(c => c.id!) as string[];
              setSelectedIds(allFilteredIds);
            } else {
              setSelectedIds([]);
            }
          }}
          className="rounded text-bu-blue focus:ring-bu-blue border-gray-300"
        />
      ),
      render: (row: CompanyMaster) => row.id ? (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(row.id)}
          onChange={e => {
            if (e.target.checked) {
              setSelectedIds(p => [...p, row.id!]);
            } else {
              setSelectedIds(p => p.filter(id => id !== row.id));
            }
          }}
          className="rounded text-bu-blue focus:ring-bu-blue border-gray-350"
        />
      ) : null
    },
    {
      key: 'code',
      header: language === 'th' ? 'รหัสสถานประกอบการ' : 'Company Code',
      render: (row: CompanyMaster) => (
        <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 border px-2 py-0.5 rounded-md">
          {row.companyCode}
        </span>
      )
    },
    {
      key: 'name',
      header: language === 'th' ? 'ชื่อสมาคม / สถานประกอบการ (TH/EN)' : 'Company Name',
      render: (row: CompanyMaster) => (
        <div 
          onClick={() => navigate(`/admin/companies/${row.id}`)}
          className="space-y-0.5 cursor-pointer group"
        >
          <span className="block font-black text-gray-900 text-sm group-hover:text-bu-blue transition-colors">
            {language === 'th' ? row.companyNameTH : row.companyNameEN}
          </span>
          <span className="block text-[11px] text-gray-400 font-semibold group-hover:text-bu-blue/60 mt-0.5">
            {language === 'th' ? row.companyNameEN : row.companyNameTH}
          </span>
        </div>
      )
    },
    {
      key: 'category',
      header: language === 'th' ? 'กลุ่มอุตสาหกรรม' : 'Category',
      render: (row: CompanyMaster) => row.businessCategoryId ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
          <Tag size={10} />
          {language === 'th' ? (row.businessCategoryNameTH || row.businessCategoryId) : (row.businessCategoryNameEN || row.businessCategoryId)}
        </span>
      ) : <span className="text-gray-300 italic text-xs font-medium">None</span>
    },
    {
      key: 'website',
      header: 'Website',
      render: (row: CompanyMaster) => row.website ? (
        <a 
          href={row.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-bu-bright font-black hover:underline"
        >
          <Globe size={13} />
          {row.website.replace('https://', '').replace('www.', '').slice(0, 20)}{row.website.length > 20 ? '...' : ''}
        </a>
      ) : <span className="text-gray-300">-</span>
    },
    {
      key: 'active',
      header: 'Status',
      render: (row: CompanyMaster) => (
        <AppBadge 
          variant={row.active ? 'success' : 'neutral'}
          label={row.active 
            ? (language === 'th' ? 'ใช้งานปกติ' : 'Active') 
            : (language === 'th' ? 'ถูกระงับ' : 'Inactive')}
        />
      )
    },
    {
      key: 'actions',
      header: language === 'th' ? 'การตั้งค่า' : 'Actions',
      render: (row: CompanyMaster) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button 
            onClick={() => navigate(`/admin/companies/${row.id}`)}
            className="p-1.5 rounded-lg hover:bg-gray-150 text-gray-500 hover:text-bu-blue transition-colors cursor-pointer"
            title={language === 'th' ? 'ดูรายละเอียด' : 'View Profile'}
          >
            <Eye size={15} />
          </button>
          <button 
            onClick={() => navigate(`/admin/companies/${row.id}/edit`)}
            className="p-1.5 rounded-lg hover:bg-gray-150 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            title={language === 'th' ? 'แก้ไขประวัติ' : 'Edit Details'}
          >
            <Edit3 size={15} />
          </button>
          {row.active ? (
            <button 
              onClick={() => handleSoftDelete(row.id!, row.companyNameEN)}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all cursor-pointer"
              title={language === 'th' ? 'ปิดใช้งาน (Soft Delete)' : 'Lock Inactive'}
            >
              <Trash2 size={15} />
            </button>
          ) : (
            <button 
              onClick={() => handleRestore(row.id!, row.companyNameEN)}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 transition-all cursor-pointer"
              title={language === 'th' ? 'กู้คืนสถานะใช้งาน' : 'Restore Active'}
            >
              <Check size={15} />
            </button>
          )}
        </div>
      )
    }
  ];

  const columnsLegacyPartners = [
    {
      key: 'id',
      header: 'ID / Code',
      render: (row: Company) => <span className="font-mono text-xs text-gray-400 font-extrabold">{row.id}</span>
    },
    {
      key: 'name',
      header: language === 'th' ? 'ชื่อสมาคม / Corporate Partner' : 'Corporate Partner',
      render: (row: Company) => (
        <div className="space-y-0.5">
          <span className="block font-bold text-gray-900 text-sm">
            {language === 'th' ? row.nameTH : row.nameEN}
          </span>
          <span className="block text-[10px] text-gray-400">
            {language === 'th' ? row.nameEN : row.nameTH}
          </span>
        </div>
      )
    },
    {
      key: 'contact',
      header: language === 'th' ? 'การติดต่อสื่อสาร' : 'Communications',
      render: (row: Company) => (
        <div className="text-xs space-y-1">
          <span className="inline-flex items-center gap-1 text-gray-600 block">
            <Mail size={12} className="text-gray-400 shrink-0" /> {row.contactEmail}
          </span>
          <span className="inline-flex items-center gap-1 text-gray-500 block">
            <Phone size={12} className="text-gray-400 shrink-0" /> {row.contactPhone}
          </span>
        </div>
      )
    },
    {
      key: 'website',
      header: 'Website',
      render: (row: Company) => row.website ? (
        <a 
          href={row.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-bu-bright font-bold hover:underline"
        >
          <Globe size={13} />
          {row.website.replace('https://', '').replace('www.', '')}
        </a>
      ) : <span className="text-gray-300">-</span>
    },
    {
      key: 'booth',
      header: 'Booth #',
      render: (row: Company) => row.boothId ? (
        <span className="inline-flex items-center gap-1 text-xs text-bu-blue font-extrabold bg-bu-blue/10 px-2.5 py-1 rounded-md border border-bu-blue/20">
          <MapPin size={12} />
          {row.boothId}
        </span>
      ) : <span className="text-xs text-gray-400 italic">Unassigned</span>
    }
  ];

  return (
    <div id="company-master-cms-page" className="space-y-6">
      
      {/* CMS Header panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader 
          title={language === 'th' ? 'ระบบจัดการข้อมูลสถานประกอบการ (Master)' : 'Company Master CMS'} 
          description={language === 'th' ? 'ฐานข้อมูลกลางสำหรับเชื่อมโยงกับฟอร์มและจัดการ CSV Onboarding' : 'Central corporate master register with real-time sync.'} 
        />
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          <AppButton 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/admin/companies/import')}
            className="flex items-center gap-1.5"
          >
            <Upload size={14} />
            {language === 'th' ? 'นำเข้าจาก CSV' : 'Import CSV'}
          </AppButton>
          <AppButton 
            variant="primary" 
            size="sm"
            onClick={() => navigate('/admin/companies/create')}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} />
            {language === 'th' ? 'เพิ่มสถานประกอบการ' : 'Add Company'}
          </AppButton>
        </div>
      </div>

      {/* Floating feedback notification toast */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl transition-all font-bold text-sm ${
          toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toastMessage.type === 'success' ? <Check size={16} /> : <XCircle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Navigation tabs: Master vs Legacy Matches */}
      <div className="flex items-center border-b border-gray-200">
        <button
          onClick={() => setActiveTab('master')}
          className={`px-4 py-2 text-sm font-black transition-colors border-b-2 cursor-pointer ${
            activeTab === 'master' 
              ? 'border-bu-blue text-bu-blue' 
              : 'border-transparent text-gray-450 hover:text-gray-700'
          }`}
        >
          {language === 'th' ? `ฐานข้อมูลหลัก Master (${masterCompanies.length})` : `Corporate Master Database (${masterCompanies.length})`}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 text-sm font-black transition-colors border-b-2 cursor-pointer ${
            activeTab === 'approved' 
              ? 'border-bu-blue text-bu-blue' 
              : 'border-transparent text-gray-450 hover:text-gray-700'
          }`}
        >
          {language === 'th' ? `จับคู่บูธงานคู่ค้า (${legacyPartners.length})` : `Partner Booth Placements (${legacyPartners.length})`}
        </button>
      </div>

      {/* TAB 1: MASTER CMS WORKSPACE */}
      {activeTab === 'master' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Advanced Search Filter Rail */}
          <AppCard className="p-4 bg-white border border-gray-200/80">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Keyword text search */}
              <div className="md:col-span-2 space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">{language === 'th' ? 'ค้นหาคำสำคัญ (ชื่อ/รหัส)' : 'Keyword Searched'}</span>
                <AppInput 
                  placeholder={language === 'th' ? 'ค้นหาด้วยรหัส, ชื่อไทย หรือ อังกฤษ...' : 'Search by Code, TH Name, EN Name...'}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  icon={<Search size={16} />}
                />
              </div>

              {/* Status Select selection */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">{language === 'th' ? 'สถานะใช้งาน' : 'Lock State'}</span>
                <select
                  value={filterActive}
                  onChange={e => setFilterActive(e.target.value)}
                  className="w-full rounded-lg border border-gray-350 px-3 py-2 text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-bu-blue/20 focus:border-bu-blue focus:outline-none"
                >
                  <option value="all">{language === 'th' ? 'ทั้งหมด (All Status)' : 'All Lock States'}</option>
                  <option value="active">{language === 'th' ? 'ใช้งานปกติ (Active)' : 'Active only'}</option>
                  <option value="inactive">{language === 'th' ? 'ถูกระงับการจับคู่' : 'Inactive only'}</option>
                </select>
              </div>

              {/* Category selector */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">{language === 'th' ? 'กลุ่มประเภทอุตสาหกรรม' : 'Category'}</span>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-350 px-3 py-2 text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-bu-blue/20 focus:border-bu-blue focus:outline-none"
                >
                  <option value="all">{language === 'th' ? 'ทุกกลุ่มอุตสาหกรรม' : 'All categories'}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {language === 'th' ? c.categoryNameTH : c.categoryNameEN}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Advance date range rails expandable */}
            <div className="mt-4 pt-4 border-t border-gray-150/50">
              <details className="group cursor-pointer select-none">
                <summary className="text-xs font-black text-bu-blue flex items-center gap-1 hover:underline">
                  <Sliders size={12} className="group-open:rotate-90 transition-transform" />
                  {language === 'th' ? 'สลับดูตัวกรองช่วงวันที่รหัสบันทึก (Date Filters)' : 'Toggle date creation and modifications range details'}
                </summary>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-3 pt-2 text-xs font-semibold cursor-default">
                  
                  {/* Created from */}
                  <div className="space-y-1">
                    <label className="text-gray-400 block">{language === 'th' ? 'สร้างเมื่อวันที่เริ่มต้น' : 'Created Date From'}</label>
                    <input 
                      type="date" 
                      value={filterCreatedFrom}
                      onChange={e => setFilterCreatedFrom(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 focus:border-bu-blue focus:outline-none" 
                    />
                  </div>

                  {/* Created to */}
                  <div className="space-y-1">
                    <label className="text-gray-400 block">{language === 'th' ? 'สร้างเมื่อวันที่สิ้นสุด' : 'Created Date To'}</label>
                    <input 
                      type="date" 
                      value={filterCreatedTo}
                      onChange={e => setFilterCreatedTo(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 focus:border-bu-blue focus:outline-none" 
                    />
                  </div>

                  {/* Updated from */}
                  <div className="space-y-1">
                    <label className="text-gray-400 block">{language === 'th' ? 'ปรับปรุงล่าสุดวันที่เริ่มต้น' : 'Updated Date From'}</label>
                    <input 
                      type="date" 
                      value={filterUpdatedFrom}
                      onChange={e => setFilterUpdatedFrom(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 focus:border-bu-blue focus:outline-none" 
                    />
                  </div>

                  {/* Updated to */}
                  <div className="space-y-1">
                    <label className="text-gray-400 block">{language === 'th' ? 'ปรับปรุงล่าสุดวันที่สิ้นสุด' : 'Updated Date To'}</label>
                    <input 
                      type="date" 
                      value={filterUpdatedTo}
                      onChange={e => setFilterUpdatedTo(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 focus:border-bu-blue focus:outline-none" 
                    />
                  </div>

                </div>
              </details>
            </div>
          </AppCard>

          {/* Bulk actions and CSV Export toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 bg-white border border-gray-150 p-3.5 rounded-xl gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <span className="font-mono text-bu-blue font-black bg-bu-blue/5 border border-bu-blue/10 px-2 py-0.5 rounded-md">
                {selectedIds.length}
              </span>
              <span>{language === 'th' ? 'บริษัทถูกเลือก' : 'companies highlighted'}</span>
              
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-1.5 pl-3 border-l ml-1.5">
                  <button
                    onClick={handleBulkActivate}
                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-extrabold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    {language === 'th' ? 'เปิดใช้งาน (Activate)' : 'Activate Selected'}
                  </button>
                  <button
                    onClick={handleBulkDeactivate}
                    className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 font-extrabold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    {language === 'th' ? 'ระงับประวัติ (Deactivate)' : 'Deactivate Selected'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Order toggler */}
              <button
                onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                className="inline-flex items-center gap-1 text-xs border border-gray-250 bg-white hover:bg-slate-50 text-gray-600 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                title="Toggle Code Sorting"
              >
                <ArrowUpDown size={12} />
                {sortOrder === 'desc' ? (language === 'th' ? 'เรียงรหัสขยับถอย' : 'Code Desc') : (language === 'th' ? 'เรียงจากน้อยไปมาก' : 'Code Asc')}
              </button>

              <AppButton
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 font-bold"
              >
                <Download size={14} />
                {language === 'th' ? 'ส่งออกชุดค้นหาเป็น CSV' : 'Export Search CSV'}
              </AppButton>
            </div>
          </div>

          {/* Master Table */}
          {loading ? (
            <AppLoading text="Subscribing to Firestore Master records with security channels..." />
          ) : (
            <AppTable 
              columns={columnsMaster} 
              data={filteredMaster} 
              keyExtractor={(row) => row.id || 'err'}
              emptyState={
                <AppEmptyState 
                  title={language === 'th' ? 'ไม่พบข้อมูลสถานประกอบการมาสเตอร์' : 'No master companies found'}
                  description={language === 'th' ? 'รายละเอียดตัวกรองค้นหาว่างเปล่า กรุณาเพิ่มประวัติ หรือจัดเตรียมชีต CSV' : 'Please upload CSV template or click Add Company to create custom listings.'}
                />
              }
            />
          )}

        </div>
      )}

      {/* TAB 2: LEGACY PLACEMENT BACKWARD COMPATIBILITY */}
      {activeTab === 'approved' && (
        <div className="space-y-4 animate-fade-in">
          <AppCard className="p-4" noPadding>
            <div className="p-4 flex items-center">
              <div className="flex-1">
                <AppInput 
                  placeholder={language === 'th' ? 'ค้นหาจับคู่บูธด้วยชื่อหรืออีเมล...' : 'Search approved corporate booth matches...'}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  icon={<Search size={16} />}
                />
              </div>
            </div>
          </AppCard>

          <AppTable 
            columns={columnsLegacyPartners} 
            data={legacyPartners.filter(p => 
              p.nameTH.toLowerCase().includes(keyword.toLowerCase()) || 
              p.nameEN.toLowerCase().includes(keyword.toLowerCase()) ||
              p.contactEmail.toLowerCase().includes(keyword.toLowerCase())
            )} 
            keyExtractor={(row) => row.id}
            emptyState={<AppEmptyState />}
          />
        </div>
      )}

    </div>
  );
};
export default Companies;
