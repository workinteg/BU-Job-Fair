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
import { AppBadge } from '../../components/AppBadge';
import { categoryService, CategoryTreeNode } from '../../services/categoryService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../firebase/AuthContext';
import { useRouter } from '../../routes/Router';
import { BusinessCategory } from '../../types';
import { 
  Tag, 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Upload, 
  ArrowLeft, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings as SettingsIcon,
  Play
} from 'lucide-react';

export const Categories: React.FC = () => {
  const { t, language } = useTranslation();
  const { currentPath, navigate } = useRouter();
  const { user } = useAuth();
  const operatorEmail = user?.email || 'workinteg@bu.ac.th';

  // State Management
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [treeData, setTreeData] = useState<CategoryTreeNode[]>([]);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterParent, setFilterParent] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('sortOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Create/Edit form states
  const [formParentCode, setFormParentCode] = useState<string>('');
  const [formCategoryCode, setFormCategoryCode] = useState<string>('');
  const [formNameTH, setFormNameTH] = useState<string>('');
  const [formNameEN, setFormNameEN] = useState<string>('');
  const [formSortOrder, setFormSortOrder] = useState<number>(10);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formAllowCustomText, setFormAllowCustomText] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // CSV Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ parentCount: number; childCount: number; failed: number } | null>(null);

  // Load Realtime Data Subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = categoryService.subscribeBusinessCategories(
      (list) => {
        setCategories(list);

        // Build tree structure
        const parents = list.filter(c => c.level === 1) as CategoryTreeNode[];
        const children = list.filter(c => c.level === 2);
        parents.forEach(p => {
          p.children = children.filter(c => c.parentCode === p.categoryCode);
        });

        setTreeData(parents);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe categories:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync edit form on ID fetch
  const editMatch = currentPath.match(/\/admin\/categories\/([^\/]+)\/edit/);
  const editId = editMatch ? editMatch[1] : null;

  useEffect(() => {
    if (editId && categories.length > 0) {
      const target = categories.find(c => c.id === editId);
      if (target) {
        setFormParentCode(target.parentCode || '');
        setFormCategoryCode(target.categoryCode);
        setFormNameTH(target.categoryNameTH);
        setFormNameEN(target.categoryNameEN);
        setFormSortOrder(target.sortOrder);
        setFormActive(target.active);
        setFormAllowCustomText(target.allowCustomText);
      }
    }
  }, [editId, categories]);

  // Helper: toggle parent collapse state
  const toggleParentExpand = (parentCode: string) => {
    setExpandedParents(prev => ({
      ...prev,
      [parentCode]: !prev[parentCode]
    }));
  };

  // Helper: Expand All Tree Groups
  const expandAll = () => {
    const next: Record<string, boolean> = {};
    treeData.forEach(p => {
      next[p.categoryCode] = true;
    });
    setExpandedParents(next);
  };

  // Helper: Collapse All Tree Groups
  const collapseAll = () => {
    setExpandedParents({});
  };

  // CSV EXPORT helper
  const handleExportCSV = async () => {
    try {
      const headers = ['id', 'categoryCode', 'parentCode', 'level', 'categoryNameTH', 'categoryNameEN', 'fullNameTH', 'fullNameEN', 'sortOrder', 'active', 'allowCustomText'];
      const rows = categories.map(c => [
        c.id || '',
        c.categoryCode,
        c.parentCode || '',
        c.level,
        `"${c.categoryNameTH.replace(/"/g, '""')}"`,
        `"${c.categoryNameEN.replace(/"/g, '""')}"`,
        `"${c.fullNameTH.replace(/"/g, '""')}"`,
        `"${c.fullNameEN.replace(/"/g, '""')}"`,
        c.sortOrder,
        c.active,
        c.allowCustomText
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `jobfair_categories_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await auditService.logAction(
        'Export Categories',
        operatorEmail,
        'all',
        'BusinessCategory',
        `Exported ${categories.length} categories to CSV file.`
      );
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  // Trigger seeding tool
  const handleSeedData = async () => {
    if (window.confirm(language === 'th' ? 'ต้องการนำเข้าหมวดหมู่ธุรกิจเริ่มต้นแบบทีเดียว (One-click Initialize) หรือไม่?' : 'Would you like to initialize all mandatory Parent-Child business categories in one-click?')) {
      try {
        setLoading(true);
        const res = await categoryService.initializeCategories(operatorEmail);
        if (res.success) {
          alert(language === 'th' ? `สร้างสำเร็จจำนวน ${res.count} หมวดหมู่ใหม่!` : `Successfully initialized ${res.count} new business categories.`);
        } else {
          alert('Failed to initialize default categories. See logs.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // CRUD: Handle Toggle Active State (Soft Delete style)
  const handleToggleActive = async (cat: BusinessCategory) => {
    const nextStatus = !cat.active;
    const confirmMessage = nextStatus 
      ? (language === 'th' ? `ต้องการเปิดใช้งานหมวดหมู่ "${cat.categoryNameTH}"?` : `Activate "${cat.categoryNameEN}"?`)
      : (language === 'th' ? `ต้องการระงับ (Soft Delete) หมวดหมู่ "${cat.categoryNameTH}"?` : `Deactivate (Soft Delete) "${cat.categoryNameEN}"?`);

    if (window.confirm(confirmMessage)) {
      try {
        await categoryService.updateBusinessCategory(cat.id || '', { active: nextStatus }, operatorEmail);
        await auditService.logAction(
          nextStatus ? 'Activate Category' : 'Deactivate Category',
          operatorEmail,
          cat.id || cat.categoryCode,
          'BusinessCategory',
          `${nextStatus ? 'Activated' : 'Deactivated (Soft deleted)'} category ${cat.categoryCode} (${cat.categoryNameEN})`
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  // CRUD: Create Form Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Val
    if (!formCategoryCode.trim()) {
      setFormError(language === 'th' ? 'กรุณาระบุรหัสหมวดธุรกิจ' : 'Category Code is required');
      return;
    }
    if (!formNameTH.trim()) {
      setFormError(language === 'th' ? 'กรุณาระบุชื่อหมวดธุรกิจภาษาไทย' : 'Category Name TH is required');
      return;
    }
    if (!formNameEN.trim()) {
      setFormError(language === 'th' ? 'กรุณาระบุชื่อหมวดธุรกิจภาษาอังกฤษ' : 'Category Name EN is required');
      return;
    }

    const compiledCode = formCategoryCode.toUpperCase().trim().replace(/\s+/g, '_');

    // Duplicate check in database
    const codeDup = categories.some(c => c.categoryCode === compiledCode);
    if (codeDup) {
      setFormError(`Duplicate Category Code "${compiledCode}" detected. Codes must be unique.`);
      return;
    }

    const nameDup = categories.some(c => 
      c.categoryNameTH.toLowerCase().trim() === formNameTH.toLowerCase().trim() ||
      c.categoryNameEN.toLowerCase().trim() === formNameEN.toLowerCase().trim()
    );
    if (nameDup) {
      setFormError(`Duplicate Category Name (TH or EN matches an existing category name)`);
      return;
    }

    // Determine level & parents
    const isLevel1 = !formParentCode;
    const level = isLevel1 ? 1 : 2;
    const parentCodeVal = isLevel1 ? null : formParentCode;

    // Duplicate parent + child check
    if (!isLevel1) {
      const combinationDup = categories.some(c => 
        c.parentCode === parentCodeVal && 
        (c.categoryNameTH.toLowerCase().trim() === formNameTH.toLowerCase().trim() ||
         c.categoryNameEN.toLowerCase().trim() === formNameEN.toLowerCase().trim())
      );
      if (combinationDup) {
        setFormError(`Duplicate Parent & Child combination. This name already exists under the parent.`);
        return;
      }
    }

    // Full names
    let fullNameTH = formNameTH.trim();
    let fullNameEN = formNameEN.trim();
    if (!isLevel1) {
      const parentObj = categories.find(c => c.categoryCode === parentCodeVal);
      if (parentObj) {
        fullNameTH = `${parentObj.categoryNameTH} > ${formNameTH.trim()}`;
        fullNameEN = `${parentObj.categoryNameEN} > ${formNameEN.trim()}`;
      }
    }

    try {
      setIsSubmitting(true);
      const response = await categoryService.createBusinessCategory({
        categoryCode: compiledCode,
        parentCode: parentCodeVal,
        level,
        categoryNameTH: formNameTH.trim(),
        categoryNameEN: formNameEN.trim(),
        fullNameTH,
        fullNameEN,
        sortOrder: Number(formSortOrder),
        active: formActive,
        allowCustomText: formAllowCustomText
      }, operatorEmail);

      await auditService.logAction(
        'Create Category',
        operatorEmail,
        response.id || response.categoryCode,
        'BusinessCategory',
        `Created new category code ${compiledCode} (${formNameEN}) level ${level}`
      );

      navigate('/admin/categories');
    } catch (err: any) {
      setFormError(err.message || 'Error creating category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CRUD: Edit Form Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCategoryCode.trim()) {
      setFormError(language === 'th' ? 'กรุณาระบุรหัสหมวดธุรกิจ' : 'Category Code is required');
      return;
    }
    if (!formNameTH.trim()) {
      setFormError(language === 'th' ? 'กรุณาระบุชื่อหมวดธุรกิจภาษาไทย' : 'Category Name TH is required');
      return;
    }
    if (!formNameEN.trim()) {
      setFormError(language === 'th' ? 'กรุณาระบุชื่อหมวดธุรกิจภาษาอังกฤษ' : 'Category Name EN is required');
      return;
    }

    const compiledCode = formCategoryCode.toUpperCase().trim().replace(/\s+/g, '_');

    // Duplicate check skipping self
    const codeDup = categories.some(c => c.id !== editId && c.categoryCode === compiledCode);
    if (codeDup) {
      setFormError(`Duplicate Category Code "${compiledCode}" detected.`);
      return;
    }

    const isLevel1 = !formParentCode;
    const level = isLevel1 ? 1 : 2;
    const parentCodeVal = isLevel1 ? null : formParentCode;

    // Full name
    let fullNameTH = formNameTH.trim();
    let fullNameEN = formNameEN.trim();
    if (!isLevel1) {
      const parentObj = categories.find(c => c.categoryCode === parentCodeVal);
      if (parentObj) {
        fullNameTH = `${parentObj.categoryNameTH} > ${formNameTH.trim()}`;
        fullNameEN = `${parentObj.categoryNameEN} > ${formNameEN.trim()}`;
      }
    }

    try {
      setIsSubmitting(true);
      await categoryService.updateBusinessCategory(editId || '', {
        categoryCode: compiledCode,
        parentCode: parentCodeVal,
        level,
        categoryNameTH: formNameTH.trim(),
        categoryNameEN: formNameEN.trim(),
        fullNameTH,
        fullNameEN,
        sortOrder: Number(formSortOrder),
        active: formActive,
        allowCustomText: formAllowCustomText
      }, operatorEmail);

      await auditService.logAction(
        'Edit Category',
        operatorEmail,
        editId || compiledCode,
        'BusinessCategory',
        `Updated category code ${compiledCode} (${formNameEN})`
      );

      navigate('/admin/categories');
    } catch (err: any) {
      setFormError(err.message || 'Error updating category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV IMPORT Parsing & Workflows
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvError(null);
      setImportSummary(null);

      // Parse csv preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setCsvError('CSV requires at least a headers row and one data row.');
          return;
        }

        // Detect correct columns header
        const parsed: any[] = [];
        const dataRows = lines.slice(1); // skip headers row: parentTH,parentEN,childTH,childEN or categoryCode, etc.

        dataRows.forEach((row, idx) => {
          const cells = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cells.length >= 4) {
            const pTH = cells[0];
            const pEN = cells[1];
            const cTH = cells[2];
            const cEN = cells[3];

            // Validations
            const isValid = pTH && pEN && cTH && cEN;
            parsed.push({
              index: idx + 1,
              parentTH: pTH,
              parentEN: pEN,
              childTH: cTH,
              childEN: cEN,
              isValid,
              status: isValid ? 'Pending Import' : 'Invalid Columns (Missing Fields)'
            });
          }
        });

        setCsvPreview(parsed);
      };
      reader.readAsText(file);
    }
  };

  const executeCsvImport = async () => {
    if (csvPreview.length === 0) return;
    try {
      setIsSubmitting(true);
      let successParent = 0;
      let successChild = 0;
      let failedRows = 0;

      // Copy categories to calculate duplicates instantly
      let localState = [...categories];

      for (const row of csvPreview) {
        if (!row.isValid) {
          failedRows++;
          continue;
        }

        // 1. Process Parent
        let pCode = row.parentEN.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
        let parentInstance = localState.find(c => c.categoryCode === pCode);

        if (!parentInstance) {
          // Create parent category dynamically
          parentInstance = await categoryService.createBusinessCategory({
            categoryCode: pCode,
            parentCode: null,
            level: 1,
            categoryNameTH: row.parentTH,
            categoryNameEN: row.parentEN,
            fullNameTH: row.parentTH,
            fullNameEN: row.parentEN,
            sortOrder: 10 + localState.length,
            active: true,
            allowCustomText: false
          }, operatorEmail);
          localState.push(parentInstance);
          successParent++;
        }

        // 2. Process Child
        let childSlug = row.childEN.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
        let cCode = `${pCode}_${childSlug}`;

        // Verify duplicate children
        const isChildDuplicate = localState.some(c => c.categoryCode === cCode);
        if (!isChildDuplicate) {
          await categoryService.createBusinessCategory({
            categoryCode: cCode,
            parentCode: pCode,
            level: 2,
            categoryNameTH: row.childTH,
            categoryNameEN: row.childEN,
            fullNameTH: `${parentInstance.categoryNameTH} > ${row.childTH}`,
            fullNameEN: `${parentInstance.categoryNameEN} > ${row.childEN}`,
            sortOrder: 20 + localState.length,
            active: true,
            allowCustomText: false
          }, operatorEmail);
          
          localState.push({
            categoryCode: cCode,
            parentCode: pCode,
            level: 2,
            categoryNameTH: row.childTH,
            categoryNameEN: row.childEN,
            fullNameTH: `${parentInstance.categoryNameTH} > ${row.childTH}`,
            fullNameEN: `${parentInstance.categoryNameEN} > ${row.childEN}`,
            sortOrder: 20 + localState.length,
            active: true,
            allowCustomText: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: operatorEmail,
            updatedBy: operatorEmail
          });
          successChild++;
        } else {
          failedRows++;
        }
      }

      await auditService.logAction(
        'Import Categories',
        operatorEmail,
        'multiple',
        'BusinessCategory',
        `Imported ${successParent} new parents and ${successChild} children from CSV.`
      );

      setImportSummary({
        parentCount: successParent,
        childCount: successChild,
        failed: failedRows
      });

      // Clear preview
      setCsvFile(null);
      setCsvPreview([]);
    } catch (err: any) {
      setCsvError(err.message || 'Error occurred during CSV import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // List search & filters computation
  const filteredCategories = categories.filter(c => {
    // 1. Search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase().trim();
      const matchNameTH = c.categoryNameTH.toLowerCase().includes(s);
      const matchNameEN = c.categoryNameEN.toLowerCase().includes(s);
      const matchCode = c.categoryCode.toLowerCase().includes(s);
      const matchFull = c.fullNameEN.toLowerCase().includes(s) || c.fullNameTH.toLowerCase().includes(s);
      if (!matchNameTH && !matchNameEN && !matchCode && !matchFull) return false;
    }

    // 2. Parent filter
    if (filterParent && c.parentCode !== filterParent) {
      return false;
    }

    // 3. Level filter
    if (filterLevel && c.level !== Number(filterLevel)) {
      return false;
    }

    // 4. Status filter
    if (filterStatus) {
      const activeBool = filterStatus === 'active';
      if (c.active !== activeBool) return false;
    }

    return true;
  });

  // Sort logic computation
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    let check = 0;
    if (sortBy === 'sortOrder') {
      check = a.sortOrder - b.sortOrder;
    } else if (sortBy === 'categoryName') {
      const nameA = language === 'th' ? a.categoryNameTH : a.categoryNameEN;
      const nameB = language === 'th' ? b.categoryNameTH : b.categoryNameEN;
      check = nameA.localeCompare(nameB);
    } else if (sortBy === 'createdAt') {
      const dateA = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
      check = dateA - dateB;
    }
    return sortOrder === 'asc' ? check : -check;
  });

  // Loading view
  if (loading) return <AppLoading text="Synching Live Categories Database..." />;

  // --------------------------------------------------------------------------------------
  // ROUTE RENDERER 1: CREATE FORM VIEW
  // --------------------------------------------------------------------------------------
  if (currentPath === '/admin/categories/create') {
    return (
      <div className="space-y-6" id="create-category-container">
        <div className="flex items-center gap-3">
          <button 
            id="back-to-categories"
            onClick={() => navigate('/admin/categories')} 
            className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition text-gray-600"
          >
            <ArrowLeft size={18} />
          </button>
          <PageHeader 
            title={language === 'th' ? 'สร้างหมวดธุรกิจวัตถุประสงค์กลาง' : 'Create New Business Category'}
            description={language === 'th' ? 'กรอกรายละเอียดเพื่อสร้างหมวดหลัก หรือหมวดสัมพันธ์ย่อย' : 'Create a master or sub-level industry category'}
          />
        </div>

        <AppCard title={language === 'th' ? 'แบบฟอร์มข้อมูลหมวดหมู่' : 'Category Details Form'}>
          <form onSubmit={handleCreateSubmit} className="space-y-6" id="create-category-form">
            {formError && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2" id="form-error">
                <AlertTriangle size={16} /> {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Parent category assignment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="parent-field-label">
                  หมวดหลัก / Parent Category (หากเป็นหมวดหลักหลัก ให้เลือกเว้นว่าง)
                </label>
                <select
                  id="parent-field-select"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formParentCode}
                  onChange={(e) => setFormParentCode(e.target.value)}
                >
                  <option value="">-- เป็นหมวดธุรกิจระดับสูงสุด (Level 1 Parent) --</option>
                  {categories.filter(c => c.level === 1).map(p => (
                    <option key={p.categoryCode} value={p.categoryCode}>
                      {p.categoryNameTH} ({p.categoryNameEN})
                    </option>
                  ))}
                </select>
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="code-field-label">
                  รหัสหมวดธุรกิจ / Category Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="code-field-input"
                  type="text"
                  placeholder="เช่น TECH, IND_AUTO, OTHERS"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg uppercase"
                  value={formCategoryCode}
                  onChange={(e) => setFormCategoryCode(e.target.value)}
                  required
                />
              </div>

              {/* Thai Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="nameth-field-label">
                  ชื่อหมวดหมู่ (ภาษาไทย) / Category Name TH <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameth-field-input"
                  type="text"
                  placeholder="เช่น ชิ้นส่วนอิเล็กทรอนิกส์"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg"
                  value={formNameTH}
                  onChange={(e) => setFormNameTH(e.target.value)}
                  required
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="nameen-field-label">
                  ชื่อหมวดหมู่ (English) / Category Name EN <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameen-field-input"
                  type="text"
                  placeholder="เช่น Electronic Components"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg"
                  value={formNameEN}
                  onChange={(e) => setFormNameEN(e.target.value)}
                  required
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="sort-field-label">
                  ลำดับการจัดเรียง / Sort Order
                </label>
                <input
                  id="sort-field-input"
                  type="number"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                />
              </div>

              {/* Option checkboxes */}
              <div className="flex flex-col gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="active-checkbox"
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">เปิดใช้งานทันที (Active)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="customtext-checkbox"
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    checked={formAllowCustomText}
                    onChange={(e) => setFormAllowCustomText(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-amber-700">
                    อนุญาตให้กรอกข้อมูลกำหนดเอง (Allow Custom Text Input)
                  </span>
                </label>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
              <button
                id="cancel-create-btn"
                type="button"
                onClick={() => navigate('/admin/categories')}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer transition text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                id="submit-create-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg cursor-pointer transition flex items-center gap-2 text-sm"
              >
                {isSubmitting ? 'Saving...' : (language === 'th' ? 'สร้างข้อมูลหมวดหมู่' : 'Create Category')}
              </button>
            </div>
          </form>
        </AppCard>
      </div>
    );
  }

  // --------------------------------------------------------------------------------------
  // ROUTE RENDERER 2: EDIT FORM VIEW
  // --------------------------------------------------------------------------------------
  if (editId) {
    return (
      <div className="space-y-6" id="edit-category-container">
        <div className="flex items-center gap-3">
          <button 
            id="back-to-categories-edit"
            onClick={() => navigate('/admin/categories')} 
            className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition text-gray-600"
          >
            <ArrowLeft size={18} />
          </button>
          <PageHeader 
            title={language === 'th' ? `แก้ไขหมวดธุรกิจ: ${formCategoryCode}` : `Edit Category: ${formCategoryCode}`}
            description={language === 'th' ? 'ปรับเปลี่ยนรายละเอียดโครงสร้างหมวดหมู่' : 'Edit details of business industry structure'}
          />
        </div>

        <AppCard title={language === 'th' ? 'แก้ไขฟอร์มข้อมูลหมวดหมู่' : 'Edit Category Details'}>
          <form onSubmit={handleEditSubmit} className="space-y-6" id="edit-category-form">
            {formError && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2" id="edit-form-error">
                <AlertTriangle size={16} /> {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Parent category assignment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="edit-parent-label">
                  หมวดหลัก / Parent Category (เว้นว่างหากเป็น Parent ระดับล่างสุด)
                </label>
                <select
                  id="edit-parent-select"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formParentCode}
                  onChange={(e) => setFormParentCode(e.target.value)}
                >
                  <option value="">-- เป็นหมวดธุรกิจระดับสูงสุด (Level 1 Parent) --</option>
                  {categories.filter(c => c.level === 1 && c.id !== editId).map(p => (
                    <option key={p.categoryCode} value={p.categoryCode}>
                      {p.categoryNameTH} ({p.categoryNameEN})
                    </option>
                  ))}
                </select>
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="edit-code-label">
                  รหัสหมวดธุรกิจ / Category Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-code-input"
                  type="text"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg uppercase"
                  value={formCategoryCode}
                  onChange={(e) => setFormCategoryCode(e.target.value)}
                  required
                />
              </div>

              {/* Thai Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="edit-nameth-label">
                  ชื่อหมวดหมู่ (ภาษาไทย) / Category Name TH <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-nameth-input"
                  type="text"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg"
                  value={formNameTH}
                  onChange={(e) => setFormNameTH(e.target.value)}
                  required
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="edit-nameen-label">
                  ชื่อหมวดหมู่ (English) / Category Name EN <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-nameen-input"
                  type="text"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg"
                  value={formNameEN}
                  onChange={(e) => setFormNameEN(e.target.value)}
                  required
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" id="edit-sort-label">
                  ลำดับการจัดเรียง / Sort Order
                </label>
                <input
                  id="edit-sort-input"
                  type="number"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                />
              </div>

              {/* Option checkboxes */}
              <div className="flex flex-col gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="edit-active-checkbox"
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">เปิดใช้งาน (Active)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="edit-customtext-checkbox"
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    checked={formAllowCustomText}
                    onChange={(e) => setFormAllowCustomText(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-amber-700">
                    อนุญาตให้กรอกข้อมูลกำหนดเอง (Allow Custom Text Input)
                  </span>
                </label>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
              <button
                id="cancel-edit-btn"
                type="button"
                onClick={() => navigate('/admin/categories')}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer transition text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                id="submit-edit-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg cursor-pointer transition flex items-center gap-2 text-sm"
              >
                {isSubmitting ? 'Saving...' : (language === 'th' ? 'บันทึกการแก้ไข' : 'Save Changes')}
              </button>
            </div>
          </form>
        </AppCard>
      </div>
    );
  }

  // --------------------------------------------------------------------------------------
  // ROUTE RENDERER 3: CSV IMPORT VIEW
  // --------------------------------------------------------------------------------------
  if (currentPath === '/admin/categories/import') {
    return (
      <div className="space-y-6" id="import-categories-container">
        <div className="flex items-center gap-3">
          <button 
            id="back-to-categories-import"
            onClick={() => navigate('/admin/categories')} 
            className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition text-gray-600"
          >
            <ArrowLeft size={18} />
          </button>
          <PageHeader 
            title={language === 'th' ? 'นำเข้าหมวดธุรกิจผ่าน CSV' : 'Import Categories via CSV'}
            description={language === 'th' ? 'เพิ่มชุดข้อมูลหมวดหมู่ย่อยและหลัก คอลัมน์รูปแบบ parentTH,parentEN,childTH,childEN' : 'Mass insert from nested format (parentTH,parentEN,childTH,childEN)'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AppCard title={language === 'th' ? 'อัปโหลดไฟล์ชุดข้อมูล CSV' : 'Upload CSV File'}>
              <div className="space-y-4">
                
                {/* Drag and Drop Zone */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition cursor-pointer relative" id="drag-drop-zone">
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  <Upload size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-bold text-gray-700">
                    {csvFile ? csvFile.name : (language === 'th' ? 'คลิกหรือลากวางไฟล์ CSV ของคุณเพื่ออัปเดต' : 'Click or drag and drop your CSV file here')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Accepts UTF-8 comma separated (.csv) up to 10MB</p>
                </div>

                {/* Status information */}
                {csvError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2" id="csv-error">
                    <AlertTriangle size={16} /> {csvError}
                  </div>
                )}

                {importSummary && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg space-y-2" id="import-summary">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle size={16} className="text-emerald-600" />
                      {language === 'th' ? 'นำเข้าเสร็จสิ้น!' : 'Import Completed successfully!'}
                    </div>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>Created Parent Categories: <strong>{importSummary.parentCount}</strong></li>
                      <li>Created Child Categories: <strong>{importSummary.childCount}</strong></li>
                      <li>Failed / Duplicate Rows: <strong>{importSummary.failed}</strong></li>
                    </ul>
                  </div>
                )}

                {csvPreview.length > 0 && (
                  <div className="space-y-3" id="preview-list">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        CSV Preview / Validations ({csvPreview.length} rows detected)
                      </span>
                      <button
                        id="execute-import-btn"
                        onClick={executeCsvImport}
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 transition cursor-pointer text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm"
                      >
                        {isSubmitting ? 'Importing...' : (language === 'th' ? 'เริ่มนำเข้าข้อมูลจริง' : 'Begin Import Data')}
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                        <thead className="bg-gray-150">
                          <tr>
                            <th className="px-3 py-2 text-gray-600 font-bold">Line</th>
                            <th className="px-3 py-2 text-gray-600 font-bold">Parent TH</th>
                            <th className="px-3 py-2 text-gray-600 font-bold">Parent EN</th>
                            <th className="px-3 py-2 text-gray-600 font-bold">Child TH</th>
                            <th className="px-3 py-2 text-gray-600 font-bold">Child EN</th>
                            <th className="px-3 py-2 text-gray-600 font-bold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 bg-white">
                          {csvPreview.map(row => (
                            <tr key={row.index} className={row.isValid ? 'bg-white' : 'bg-red-50'}>
                              <td className="px-3 py-2 font-mono text-gray-400">{row.index}</td>
                              <td className="px-3 py-2 font-medium">{row.parentTH || '-'}</td>
                              <td className="px-3 py-2 font-medium">{row.parentEN || '-'}</td>
                              <td className="px-3 py-2">{row.childTH || '-'}</td>
                              <td className="px-3 py-2">{row.childEN || '-'}</td>
                              <td className="px-3 py-2 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.isValid ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </AppCard>
          </div>

          <div>
            <AppCard title="CSV Format Requirements">
              <div className="text-xs text-gray-500 space-y-4">
                <p className="leading-relaxed">
                  Your CSV must strictly follow this header schema format (comma-separated):
                </p>
                <pre className="p-3 bg-gray-900 text-zinc-100 rounded-md font-mono text-[11px] overflow-x-auto">
                  parentTH,parentEN,childTH,childEN{"\n"}
                  Industrials,Industrials,Automotive,Automotive{"\n"}
                  Services,Services,Commerce,Commerce
                </pre>
                <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-150">
                  <span className="font-bold block mb-1">Dual-Language Compliance</span>
                  <p className="leading-relaxed">All fields are mandatory. If a parent category does not exist in the database, the importer will dynamically create it first before appending the child category relationship.</p>
                </div>
              </div>
            </AppCard>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------------------
  // DEFAULT ROUTE RENDERER: CATEGORY TREE & LIST VIEW
  // --------------------------------------------------------------------------------------
  return (
    <div className="space-y-6" id="categories-main-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title={t('menu.categories')} 
          description={language === 'th' ? 'ระบบจัดลำดับหมวดหมู่ธุรกิจส่วนกลาง ข้อมูลสนับสนุนสำหรับผู้ระบุลงทะเบียนและแอดมิน' : 'Hierarchical business categories, providing clean master options for registrations and dashboard analytics'}
        />

        {/* Global actions: Create, Seed, Export */}
        <div className="flex flex-wrap items-center gap-2" id="header-actions">
          <button
            id="seed-categories-btn"
            onClick={handleSeedData}
            className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer transition font-bold text-xs flex items-center gap-2 shadow-sm"
            title="Initialize Categories with Standard Bangkok University List"
          >
            <Sparkles size={14} /> {language === 'th' ? 'สร้างคุณสมบัติเริ่มต้น' : 'Initialize Seed Data'}
          </button>
          
          <button
            id="export-categories-btn"
            onClick={handleExportCSV}
            className="h-10 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-lg cursor-pointer transition font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            <Download size={14} /> {language === 'th' ? 'ส่งออกเป็น CSV' : 'Export CSV'}
          </button>

          <button
            id="goto-import-btn"
            onClick={() => navigate('/admin/categories/import')}
            className="h-10 px-4 border border-zinc-300 bg-white hover:bg-zinc-50 text-neutral-800 rounded-lg cursor-pointer transition font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            <Upload size={14} /> {language === 'th' ? 'นำเข้า CSV' : 'Import CSV'}
          </button>

          <button
            id="goto-create-btn"
            onClick={() => navigate('/admin/categories/create')}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            <Plus size={14} /> {language === 'th' ? 'สร้างหมวดธุรกิจ' : 'Create Category'}
          </button>
        </div>
      </div>

      {/* SEARCH, FILTER & SORT PANEL */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4" id="search-filter-panel">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={16} />
            </span>
            <input
              id="categories-search"
              type="text"
              className="w-full h-11 pl-10 pr-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={language === 'th' ? 'ค้นหาชื่อหมวดหมู่ (TH), Label (EN), รหัสโค้ด...' : 'Search category name, English labels, codes...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter: Parent list */}
          <div>
            <select
              id="filter-parent-select"
              className="w-full h-11 px-3 border border-gray-300 bg-white rounded-lg text-sm"
              value={filterParent}
              onChange={(e) => setFilterParent(e.target.value)}
            >
              <option value="">-- กรองดึงตามหมวดหลัก / All Parents --</option>
              {categories.filter(c => c.level === 1).map(p => (
                <option key={p.categoryCode} value={p.categoryCode}>
                  {p.categoryNameTH} ({p.categoryNameEN})
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Level */}
          <div>
            <select
              id="filter-level-select"
              className="w-full h-11 px-3 border border-gray-300 bg-white rounded-lg text-sm"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="">-- ระดับหมวดที่จัดลำดับ / Level --</option>
              <option value="1">Parent Category Only (Level 1)</option>
              <option value="2">Child Category Only (Level 2)</option>
            </select>
          </div>

        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter: Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
              <select
                id="filter-status-select"
                className="h-8 px-2 border border-gray-300 bg-white rounded text-xs font-semibold"
                value={filterStatus}
                onChange={(e) => setFormError(null) || setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active (คงอยู่)</option>
                <option value="inactive">Inactive (Soft Deleted)</option>
              </select>
            </div>

            {/* Sort selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Sort By:</span>
              <select
                id="sort-by-select"
                className="h-8 px-2 border border-gray-300 bg-white rounded text-xs font-semibold"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="sortOrder">Sort Order (ลำดับ)</option>
                <option value="categoryName">Category Name (ชื่อตัวอักษร)</option>
                <option value="createdAt">Created Date (วันที่สร้าง)</option>
              </select>
              <button
                id="sort-order-toggle"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-gray-100 rounded border border-gray-300 bg-white cursor-pointer"
                title="Toggle Sort Directions"
              >
                <ArrowUpDown size={14} className="text-gray-600" />
              </button>
            </div>
          </div>

          <div className="text-xs text-mono text-gray-400 font-semibold" id="categories-count-indicator">
            Found {sortedCategories.length} categories on view matches
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT/MID MAIN COLUMN: TREE AND DETAILED LIST VIEW */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* THE TREE VIEW */}
          <AppCard 
            title={language === 'th' ? 'โครงสร้างหมวดหมู่แบบลำดับชั้น (Tree View)' : 'Industry Hierarchical Tree View'}
            actions={
              <div className="flex items-center gap-2" id="tree-expand-toggle-group">
                <button 
                  id="expand-all-tree"
                  onClick={expandAll} 
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-[10px] text-gray-700 uppercase cursor-pointer"
                >
                  Expand All
                </button>
                <button 
                  id="collapse-all-tree"
                  onClick={collapseAll} 
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-[10px] text-gray-700 uppercase cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            }
          >
            <div className="space-y-3" id="main-tree-elements">
              {treeData.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400" id="empty-tree">
                  No Categories Seedeed. Click "Initialize Seed Data" to bootstrap.
                </div>
              ) : (
                treeData.map(parent => {
                  const isExpanded = expandedParents[parent.categoryCode];
                  const hasChildren = parent.children && parent.children.length > 0;
                  const isParentSelectedByFilter = !filterParent || filterParent === parent.categoryCode;
                  
                  if (!isParentSelectedByFilter) return null;

                  return (
                    <div 
                      key={parent.id || parent.categoryCode} 
                      className={`border rounded-lg transition-all ${parent.active ? 'border-gray-200 bg-white' : 'border-red-100 bg-red-50/25'}`}
                      id={`tree-parent-${parent.categoryCode}`}
                    >
                      
                      {/* Parent Header Row */}
                      <div className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition">
                        <div className="flex items-center gap-3">
                          <button
                            id={`expand-btn-${parent.categoryCode}`}
                            onClick={() => toggleParentExpand(parent.categoryCode)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 cursor-pointer disabled:opacity-20"
                            disabled={!hasChildren}
                          >
                            {hasChildren ? (
                              isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                            ) : (
                              <ChevronRight size={18} className="opacity-0" />
                            )}
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <Folder size={18} className="text-blue-600" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm">
                                  {parent.categoryNameTH} ({parent.categoryNameEN})
                                </span>
                                <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                  {parent.categoryCode}
                                </span>
                                {parent.allowCustomText && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-full">
                                    COMMENTS ALLOWED
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                Level 1 Parent • Order: {parent.sortOrder}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" id="parent-row-actions">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${parent.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {parent.active ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            id={`edit-parent-${parent.id}`}
                            onClick={() => navigate(`/admin/categories/${parent.id}/edit`)}
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded text-gray-600 transition"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            id={`deactivate-parent-${parent.id}`}
                            onClick={() => handleToggleActive(parent)}
                            className={`p-1.5 rounded transition ${parent.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            title={parent.active ? 'Archive' : 'Restore'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Children Rows */}
                      {hasChildren && isExpanded && (
                        <div className="bg-gray-50/50 border-t divide-y divide-gray-150 pl-10" id={`children-container-${parent.categoryCode}`}>
                          {parent.children.map(child => (
                            <div 
                              key={child.id || child.categoryCode} 
                              className={`p-3 flex items-center justify-between gap-4 transition-colors ${child.active ? '' : 'bg-red-50/20'}`}
                              id={`tree-child-${child.categoryCode}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-800 text-xs">
                                      {child.categoryNameTH} ({child.categoryNameEN})
                                    </span>
                                    <span className="font-mono text-[9px] bg-white text-gray-500 px-1 rounded border">
                                      {child.categoryCode}
                                    </span>
                                    {child.allowCustomText && (
                                      <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-full">
                                        COMMENTS ALLOWED
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-gray-400 block mt-0.5">
                                    Level 2 Child • Order: {child.sortOrder}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${child.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {child.active ? 'Active' : 'Inactive'}
                                </span>
                                <button
                                  id={`edit-child-${child.id}`}
                                  onClick={() => navigate(`/admin/categories/${child.id}/edit`)}
                                  className="p-1 bg-white hover:bg-gray-100 rounded border text-gray-600 transition"
                                  title="Edit"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  id={`deactivate-child-${child.id}`}
                                  onClick={() => handleToggleActive(child)}
                                  className={`p-1 rounded transition border ${child.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                  title={child.active ? 'Deactivate' : 'Activate'}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </AppCard>

          {/* THE GENERAL GRID DETAILS (COMPLEMENT FOR DESKTOP AND CARDS FOR MOBILE as requested) */}
          <div className="block lg:hidden" id="mobile-cards-view">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Categories Mobile Card View</h3>
            <div className="space-y-4">
              {sortedCategories.map(c => (
                <div key={c.id} className="p-4 bg-white rounded-xl border border-gray-200 space-y-3" id={`mobile-card-${c.categoryCode}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-extrabold uppercase mb-1 inline-block">
                        {c.categoryCode}
                      </span>
                      <h4 className="font-extrabold text-sm text-gray-900">{c.categoryNameTH}</h4>
                      <p className="text-xs text-gray-500">{c.categoryNameEN}</p>
                    </div>
                    <AppBadge variant={c.active ? 'success' : 'neutral'}>
                      {c.active ? 'Active' : 'Inactive'}
                    </AppBadge>
                  </div>

                  <div className="text-[11px] text-gray-400 space-y-1 pt-2 border-t border-gray-100">
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <span className="font-bold text-gray-700">Level {c.level} ({c.level === 1 ? 'Parent' : 'Child'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sort Order:</span>
                      <span className="font-bold text-gray-700">{c.sortOrder}</span>
                    </div>
                    {c.parentCode && (
                      <div className="flex justify-between">
                        <span>Parent Code:</span>
                        <span className="font-mono">{c.parentCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      id={`edit-mobile-${c.id}`}
                      onClick={() => navigate(`/admin/categories/${c.id}/edit`)}
                      className="px-3 py-1 border border-zinc-300 text-xs font-semibold rounded hover:bg-zinc-50 "
                    >
                      Edit
                    </button>
                    <button
                      id={`deactivate-mobile-${c.id}`}
                      onClick={() => handleToggleActive(c)}
                      className={`px-3 py-1 text-xs font-semibold rounded ${c.active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                    >
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block" id="desktop-list-view">
            <AppCard title={language === 'th' ? 'ตารางรายชื่อหมวดหมู่ (Category List)' : 'Detailed Categories Flat Matrix'}>
              <AppTable
                keyExtractor={(row: BusinessCategory) => row.id || row.categoryCode}
                data={sortedCategories}
                emptyState={<AppEmptyState />}
                columns={[
                  {
                    key: 'categoryCode',
                    header: 'Code',
                    render: (row: BusinessCategory) => <span className="font-mono text-xs font-bold">{row.categoryCode}</span>
                  },
                  {
                    key: 'categoryNameTH',
                    header: 'Category Name TH',
                    render: (row: BusinessCategory) => <span className="font-bold text-sm text-gray-900">{row.categoryNameTH}</span>
                  },
                  {
                    key: 'categoryNameEN',
                    header: 'Category Name EN',
                    render: (row: BusinessCategory) => <span className="text-xs text-gray-500">{row.categoryNameEN}</span>
                  },
                  {
                    key: 'level',
                    header: 'Level',
                    render: (row: BusinessCategory) => (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.level === 1 ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800'}`}>
                        {row.level === 1 ? 'Parent' : 'Child'}
                      </span>
                    )
                  },
                  {
                    key: 'parentCode',
                    header: 'Parent',
                    render: (row: BusinessCategory) => row.parentCode ? <span className="font-mono text-xs text-gray-400">{row.parentCode}</span> : <span className="text-zinc-300">-</span>
                  },
                  {
                    key: 'active',
                    header: 'Status',
                    render: (row: BusinessCategory) => (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {row.active ? 'Active' : 'Soft Deleted'}
                      </span>
                    )
                  },
                  {
                    key: 'sortOrder',
                    header: 'Sort Order',
                    render: (row: BusinessCategory) => <span className="font-semibold text-xs">{row.sortOrder}</span>
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row: BusinessCategory) => (
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`edit-list-${row.id}`}
                          onClick={() => navigate(`/admin/categories/${row.id}/edit`)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-600 transition"
                          title="Edit Info"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          id={`deactivate-list-${row.id}`}
                          onClick={() => handleToggleActive(row)}
                          className={`p-1 rounded transition ${row.active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={row.active ? 'Soft Delete' : 'Restore'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  }
                ]}
              />
            </AppCard>
          </div>

        </div>

        {/* RIGHT COLUMN: SYSTEM CARD INFRASTRUCTURES */}
        <div>
          <AppCard title="Category Framework Hub">
            <div className="text-xs text-gray-500 space-y-4">
              <p className="leading-relaxed">
                This central repository of Parent and nested Child nodes isolates professional fields of study and company structures at Bangkok University.
              </p>
              
              <div className="p-3 bg-bu-slate rounded-lg border border-gray-150 space-y-2">
                <span className="font-bold text-gray-700 block mb-1">Standard Specifications</span>
                <ul className="space-y-1 list-disc list-inside">
                  <li>2-Tier strict classification (Parent &gt; Child)</li>
                  <li>Soft Delete implemented globally (active = false)</li>
                  <li>Realtime changes propagated instantly</li>
                  <li>Master lookup bound as source of company registers</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="font-bold text-amber-800 block mb-1">Interactive OTHERS category</span>
                <p className="leading-relaxed text-amber-700">
                  Selecting Others (Code: OTHERS, Level: 1) triggers customized descriptive labels on registrations ensuring students can catalog custom business paths seamlessly.
                </p>
              </div>
            </div>
          </AppCard>
        </div>

      </div>
    </div>
  );
};

export default Categories;
