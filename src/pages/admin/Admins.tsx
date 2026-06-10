/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { adminService, AdminUser } from '../../services/adminService';
import { useAuth } from '../../firebase/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { PageHeader } from '../../components/PageHeader';
import { AppCard } from '../../components/AppCard';
import { AppTable } from '../../components/AppTable';
import { AppModal } from '../../components/AppModal';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { AppSelect } from '../../components/AppSelect';
import { AppBadge } from '../../components/AppBadge';
import { AppLoading } from '../../components/AppLoading';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Shield, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  X,
  UserCheck2,
  AlertCircle
} from 'lucide-react';

export const Admins: React.FC = () => {
  const { user: currentUser, role: userRole } = useAuth();
  const { language } = useTranslation();

  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // New Admin fields
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<'superAdmin' | 'admin'>('admin');
  const [newActive, setNewActive] = useState<boolean>(true);
  
  // UI Validation errors
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch admin master list
  const fetchAdmins = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await adminService.getAll();
      setAdminsList(result.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        language === 'th' 
          ? 'เกิดข้อผิดพลาดในการดึงข้อมูลบัญชีผู้ดูแลระบบ' 
          : 'Failed to retrieve administrator configurations.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [language]);

  // Handle addition of new administrator
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSubmitting(true);

    const emailInput = newEmail.trim().toLowerCase();

    // 1. Email Required Validation
    if (!emailInput) {
      setValidationError(
        language === 'th' ? 'กรุณากรอกอีเมล' : 'Email address is required.'
      );
      setSubmitting(false);
      return;
    }

    // 2. Allowed domain check (@bu.ac.th)
    if (!emailInput.endsWith('@bu.ac.th')) {
      setValidationError(
        language === 'th' 
          ? 'อีเมลต้องลงท้ายด้วย @bu.ac.th สิทธิ์ระบุเฉพาะในสถาบันเท่านั้น' 
          : 'Email address must belong to Bangkok University (@bu.ac.th).'
      );
      setSubmitting(false);
      return;
    }

    // 3. Prevent duplicate emails
    const emailExists = adminsList.some(
      (adm) => adm.email.toLowerCase() === emailInput
    );
    if (emailExists) {
      setValidationError(
        language === 'th' 
          ? `อีเมล ${emailInput} มีสิทธิ์ผู้ใช้งานระบบอยู่ในฐานข้อมูลแล้ว` 
          : `Email ${emailInput} is already configured as an administrator.`
      );
      setSubmitting(false);
      return;
    }

    try {
      const operatorEmail = currentUser?.email || 'workinteg@bu.ac.th';
      await adminService.addAdmin(emailInput, newRole, newActive, operatorEmail);
      
      // Reset forms and trigger re-fetch
      setNewEmail('');
      setNewRole('admin');
      setNewActive(true);
      setIsModalOpen(false);
      await fetchAdmins();
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || 'System error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle user active/inactive status
  const handleToggleStatus = async (adminId: string, email: string, currentStatus: boolean) => {
    // Prevent self-disabling
    if (currentUser?.email?.toLowerCase() === email.toLowerCase()) {
      alert(
        language === 'th'
          ? 'ระบบป้องกัน: คุณไม่สามารถระงับสิทธิ์การใช้งานบัญชีของคุณเองได้'
          : 'System Defense: You cannot deactivate your own account session.'
      );
      return;
    }

    try {
      const operatorEmail = currentUser?.email || 'workinteg@bu.ac.th';
      await adminService.updateAdminStatus(adminId, email, !currentStatus, operatorEmail);
      
      // Update state locally for snappier UI response
      setAdminsList(prev => 
        prev.map(adm => 
          adm.id === adminId ? { ...adm, active: !currentStatus, updatedAt: new Date() } : adm
        )
      );
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Toggle/Switch roles between admin and superAdmin
  const handleToggleRole = async (adminId: string, email: string, currentRole: 'superAdmin' | 'admin') => {
    // Prevent self-role-downgrading of active super admin
    if (currentUser?.email?.toLowerCase() === email.toLowerCase() && currentRole === 'superAdmin') {
      alert(
        language === 'th'
          ? 'ระบบป้องกัน: คุณไม่สามารถลดระดับสิทธิ์ของบัญชีตัวเองได้'
          : 'System Defense: You cannot downgrade your own administrative status.'
      );
      return;
    }

    const nextRole = currentRole === 'superAdmin' ? 'admin' : 'superAdmin';
    if (!window.confirm(
      language === 'th'
        ? `ยืนยันการเปลี่ยนแปลงบทบาทของ ${email} เป็น ${nextRole === 'superAdmin' ? 'Super Admin' : 'Admin'}?`
        : `Are you sure you want to change role of ${email} to ${nextRole === 'superAdmin' ? 'Super Admin' : 'Admin'}?`
    )) {
      return;
    }

    try {
      const operatorEmail = currentUser?.email || 'workinteg@bu.ac.th';
      await adminService.updateAdminRole(adminId, email, nextRole, operatorEmail);
      
      // Update state locally
      setAdminsList(prev => 
        prev.map(adm => 
          adm.id === adminId ? { ...adm, role: nextRole, updatedAt: new Date() } : adm
        )
      );
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  // Match search & role filter parameters
  const filteredAdmins = adminsList.filter((adm) => {
    const matchesSearch =
      adm.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || adm.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && adm.active) ||
      (statusFilter === 'inactive' && !adm.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Table Column Schema Layout
  const columns = [
    {
      key: 'identity',
      header: language === 'th' ? 'ข้อมูลสมาชิกผู้ทำงาน' : 'Member Coordinates',
      render: (row: AdminUser) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-sm tracking-wide">{row.email}</span>
          <span className="text-xs text-gray-400 mt-0.5">
            {row.displayName || (language === 'th' ? 'รอยืนยันการล็อกอินครั้งแรก' : 'Awaiting initial authentication')}
          </span>
        </div>
      )
    },
    {
      key: 'role',
      header: language === 'th' ? 'บทบาท / สิทธิ์' : 'System Role',
      render: (row: AdminUser) => {
        const isSuper = row.role === 'superAdmin';
        return (
          <div className="flex items-center gap-2">
            <AppBadge variant={isSuper ? 'info' : 'primary'}>
              <div className="flex items-center gap-1">
                <Shield size={12} />
                <span>{row.role === 'superAdmin' ? 'Super Admin' : 'Admin'}</span>
              </div>
            </AppBadge>
            <button
              onClick={() => handleToggleRole(row.id!, row.email, row.role)}
              className="text-[10px] text-bu-blue hover:underline cursor-pointer font-bold ml-1"
              title="Change user access level"
            >
              {language === 'th' ? '[สลับสิทธิ์]' : '[Switch]'}
            </button>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: language === 'th' ? 'สถานะผู้ใช้งาน' : 'Access Status',
      render: (row: AdminUser) => (
        <div className="flex items-center gap-2">
          <AppBadge variant={row.active ? 'success' : 'danger'}>
            {row.active 
              ? (language === 'th' ? 'เปิดการใช้งานปกติ' : 'Active Access') 
              : (language === 'th' ? 'ระงับสิทธิ์ชั่วคราว' : 'Deactivated')}
          </AppBadge>
          <button
            onClick={() => handleToggleStatus(row.id!, row.email, row.active)}
            className="text-gray-400 hover:text-slate-800 transition-colors p-1"
            title={row.active ? 'Disable account access' : 'Enable account access'}
          >
            {row.active ? (
              <ToggleRight className="text-bu-success cursor-pointer" size={24} />
            ) : (
              <ToggleLeft className="text-gray-300 cursor-pointer" size={24} />
            )}
          </button>
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: language === 'th' ? 'อัปเดตล่าสุด' : 'Last Modified',
      render: (row: AdminUser) => {
        const val = row.updatedAt;
        const d = val instanceof Date 
          ? val 
          : (val && typeof (val as any).toDate === 'function' 
              ? (val as any).toDate() 
              : new Date(val as any));
        const formatted = d instanceof Date && !isNaN(d.getTime()) ? d.toLocaleString(language === 'th' ? 'th-TH' : 'en-US') : '-';
        return (
          <span className="text-xs text-gray-400 font-mono">
            {formatted}
          </span>
        );
      }
    }
  ];

  if (loading) {
    return <AppLoading text={language === 'th' ? 'กำลังดึงฐานสิทธิ์ผู้ใช้...' : 'Loading access masters...'} />;
  }

  return (
    <div className="space-y-6">
      {/* Header section with page descriptions */}
      <PageHeader
        title={language === 'th' ? 'ระบบจัดการสิทธิ์ผู้ทำงาน' : 'Staff Level Access Management'}
        description={
          language === 'th'
            ? 'ระบุ ค้นหา แต่งตั้งสิทธิ์ผู้ดูแลระบบในฐานข้อมูล ยอมรับสิทธิ์เฉพาะพนักงานที่มีสิทธิ์ @bu.ac.th เท่านั้น'
            : 'Audit, lookup, and provision administrative user coordinates. Authorization matches university profiles exclusively.'
        }
        actions={
          <AppButton
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl text-xs font-bold"
          >
            <UserPlus size={16} />
            {language === 'th' ? 'เพิ่มผู้ดูแลระบบ' : 'Add System Admin'}
          </AppButton>
        }
      />

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-sm text-bu-danger font-medium leading-relaxed">
          <AlertCircle size={20} />
          {errorMsg}
        </div>
      )}

      {/* Control filters dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <AppInput
            id="admin-search-input"
            placeholder={language === 'th' ? 'ค้นหาด้วยอีเมล หรือ ชื่อผู้บันทึก...' : 'Search by email or name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>

        {/* Role Filter */}
        <div className="md:col-span-3">
          <AppSelect
            id="role-filter-select"
            options={[
              { value: 'all', label: language === 'th' ? 'แสดงทุกตำแหน่งสิทธิ์' : 'All System Roles' },
              { value: 'superAdmin', label: 'Super Admin' },
              { value: 'admin', label: 'Admin (Staff)' }
            ]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3">
          <AppSelect
            id="status-filter-select"
            options={[
              { value: 'all', label: language === 'th' ? 'แสดงทุกสถานะ' : 'All Access Statuses' },
              { value: 'active', label: language === 'th' ? 'เปิดสิทธิ์ใช้งานปกติ' : 'Status: Active' },
              { value: 'inactive', label: language === 'th' ? 'ระงับสิทธิ์ชั่วคราว' : 'Status: Disabled' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Admins Table AppCard block */}
      <AppCard className="overflow-hidden">
        <AppTable
          columns={columns}
          data={filteredAdmins}
          keyExtractor={(row) => row.id || row.email}
          emptyState={
            <div className="text-center py-12 flex flex-col items-center">
              <Users size={48} className="text-gray-300 mb-3" />
              <p className="text-base font-bold text-gray-500">
                {language === 'th' ? 'ไม่มีพบข้อมูลผู้ใช้นี้' : 'No Admin Profiles Found'}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {language === 'th' 
                  ? 'ไม่พบข้อมูลสัญญาสอดคล้องกับการค้นหาหรือการคัดกรองระบบในปัจจุบัน' 
                  : 'Adjust filters or search parameters to verify other admin profiles.'}
              </p>
            </div>
          }
        />
      </AppCard>

      {/* ADD ADMIN MODAL COMPONENT */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setValidationError(null);
          setNewEmail('');
        }}
        title={language === 'th' ? 'เพิ่มผู้ใช้งานระบบผู้ควบคุม' : 'Provision Administrative Level'}
        footer={
          <div className="flex gap-3 justify-end">
            <AppButton
              variant="outline"
              type="button"
              id="cancel-modal"
              onClick={() => {
                setIsModalOpen(false);
                setValidationError(null);
                setNewEmail('');
              }}
            >
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </AppButton>
            <AppButton
              variant="primary"
              id="submit-modal"
              type="submit"
              form="add-admin-form"
              isLoading={submitting}
            >
              {language === 'th' ? 'พิจารณาเพิ่มสิทธิ์' : 'Confirm Access'}
            </AppButton>
          </div>
        }
      >
        <form id="add-admin-form" onSubmit={handleAddAdmin} className="space-y-4">
          
          {validationError && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex gap-2.5 text-xs text-bu-danger font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Email input field */}
          <div>
            <AppInput
              id="new-admin-email"
              label={language === 'th' ? 'อีเมลมหาวิทยาลัย (@bu.ac.th)' : 'Google email address (@bu.ac.th)'}
              placeholder="example@bu.ac.th"
              type="text"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full"
            />
            <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
              {language === 'th' 
                ? 'ระบบจะล็อคสิทธิ์สำหรับกลุ่มผู้ใช้งานและที่อยู่โดเมนองค์กรของมหาวิทยาลัยกรุงเทพเท่านั้น' 
                : 'Account matching strictly expects a standard user login address conforming to @bu.ac.th suffix.'}
            </p>
          </div>

          {/* Role designation */}
          <div>
            <AppSelect
              id="new-admin-role"
              label={language === 'th' ? 'บทบาทหลัก' : 'Assigned Role Level'}
              options={[
                { value: 'admin', label: language === 'th' ? 'Admin - เจ้าหน้าที่ระดับปฏิบัติงาน' : 'Admin - General Staff Operations' },
                { value: 'superAdmin', label: language === 'th' ? 'Super Admin - ผู้ดูแลระบบระดับสูงสุด' : 'Super Admin - Full Configurations' }
              ]}
              value={newRole}
              onChange={(e: any) => setNewRole(e.target.value)}
            />
          </div>

          {/* Default Active toggle */}
          <div>
            <AppSelect
              id="new-admin-active"
              label={language === 'th' ? 'สิทธิ์ผู้ใช้งานเบื้องต้น' : 'Initial Status'}
              options={[
                { value: 'true', label: language === 'th' ? 'เปิดใช้งานทันที' : 'Enable immediately' },
                { value: 'false', label: language === 'th' ? 'ระงับการพิมพ์ชั่วคราว' : 'Deactivate initially' }
              ]}
              value={String(newActive)}
              onChange={(e) => setNewActive(e.target.value === 'true')}
            />
          </div>

        </form>
      </AppModal>
    </div>
  );
};
export default Admins;
