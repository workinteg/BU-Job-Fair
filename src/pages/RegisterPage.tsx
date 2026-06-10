/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { useRouter } from '../routes/Router';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { AppSelect } from '../components/AppSelect';
import { PageHeader } from '../components/PageHeader';
import { categoryService } from '../services/categoryService';
import { registrationService } from '../services/registrationService';
import { BusinessCategorySelector } from '../components/BusinessCategorySelector';
import { BusinessCategory } from '../types';
import { Building2, User, Mail, Phone, Globe, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { navigate } = useRouter();
  
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  
  const [formData, setFormData] = useState({
    companyNameTH: '',
    companyNameEN: '',
    categoryId: '',
    customCategoryText: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCats = async () => {
      try {
        const list = await categoryService.getAllBusinessCategories();
        setCategories(list);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingCats(false);
      }
    };
    loadCats();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.companyNameTH.trim()) errors.companyNameTH = 'กรุณาระบุชื่อบริษัทภาษาไทย';
    if (!formData.companyNameEN.trim()) errors.companyNameEN = 'Corporate Name is required';
    if (!formData.categoryId) errors.categoryId = 'กรุณาระบุหมวดธุรกิจ / Category is required';
    if (!formData.contactPerson.trim()) errors.contactPerson = 'Contact representative is required';
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailPattern.test(formData.email)) {
      errors.email = 'Please provide a valid email format';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Contact number is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const selectedCat = categories.find(c => c.id === formData.categoryId);
      const catNameTH = selectedCat 
        ? (formData.customCategoryText ? `${selectedCat.categoryNameTH} (${formData.customCategoryText})` : selectedCat.categoryNameTH) 
        : '';
      const catNameEN = selectedCat 
        ? (formData.customCategoryText ? `${selectedCat.categoryNameEN} (${formData.customCategoryText})` : selectedCat.categoryNameEN) 
        : '';

      // Simulate/Trigger saving through the registrationService
      await registrationService.create({
        registrationNumber: 'PENDING',
        companyNameTH: formData.companyNameTH,
        companyNameEN: formData.companyNameEN,
        coordinatorName: formData.contactPerson,
        position: '',
        phone: formData.phone,
        email: formData.email,
        lineId: '',
        businessCategoryId: formData.categoryId,
        businessCategoryNameTH: catNameTH,
        businessCategoryNameEN: catNameEN,
        eventDateId: '',
        logoUrl: '',
        staffCount: 0,
        parkingCount: 0,
        hasBUICJobs: false,
        hasFreelance: false,
        marketingAreaRequested: false,
        status: 'pending',
        submittedAt: new Date(),
        approvedAt: null,
        assignedBoothId: null,
        assignedBoothCode: null
      }, 'public');
      
      // Navigate to Success
      navigate('/success');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const catOptions = categories.map(c => ({
    value: c.id,
    label: language === 'th' ? c.nameTH : c.nameEN
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <button 
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-bu-blue transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        {t('back_to_home')}
      </button>

      <PageHeader 
        title={t('register.title')} 
        description={t('register.desc')}
      />

      <AppCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <h4 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              1. Corporate Profile / ข้อมูลองค์กร
            </h4>
            <div className="h-px bg-gray-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppInput 
              label="Company Name (Thai) * / ชื่อบริษัทภาษาไทย"
              name="companyNameTH"
              value={formData.companyNameTH}
              onChange={handleChange}
              error={formErrors.companyNameTH}
              placeholder="เช่น บริษัท สยามเทคโนโลยี จำกัด"
              icon={<Building2 size={16} />}
            />

            <AppInput 
              label="Company Name (English) * / ชื่อบริษัทภาษาอังกฤษ"
              name="companyNameEN"
              value={formData.companyNameEN}
              onChange={handleChange}
              error={formErrors.companyNameEN}
              placeholder="e.g. Siam Technology Co., Ltd."
              icon={<Building2 size={16} />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 select-none">
              <BusinessCategorySelector
                selectedId={formData.categoryId}
                selectedCustomText={formData.customCategoryText}
                onChange={(id, customText) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    categoryId: id || '', 
                    customCategoryText: customText 
                  }));
                  if (id && formErrors.categoryId) {
                    setFormErrors(prev => ({ ...prev, categoryId: '' }));
                  }
                }}
                error={formErrors.categoryId}
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <AppInput 
                label="Website URL / เว็บไซต์บริษัท"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="e.g. www.yourcompany.com"
                icon={<Globe size={16} />}
              />
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <h4 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              2. Authorized Representative / ข้อมูลผู้ติดต่อประสานงาน
            </h4>
            <div className="h-px bg-gray-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AppInput 
              label="Full Name * / ชื่อ-นามสกุลจริง"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              error={formErrors.contactPerson}
              placeholder="สมจิต มั่นคง"
              icon={<User size={16} />}
            />

            <AppInput 
              label="Email Address * / อีเมลประสานงานหลัก"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              placeholder="contact@company.com"
              icon={<Mail size={16} />}
            />

            <AppInput 
              label="Mobile Number * / เบอร์โทรศัพท์ติดต่อ"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={formErrors.phone}
              placeholder="e.g. 0812345678"
              icon={<Phone size={16} />}
            />
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <AppButton 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/')}
              className="cursor-pointer"
            >
              {t('cancel')}
            </AppButton>
            <AppButton 
              type="submit" 
              variant="primary" 
              isLoading={isSubmitting}
              className="px-6 font-bold cursor-pointer"
            >
              Apply now / ส่งข้อมูลลงทะเบียน
            </AppButton>
          </div>
        </form>
      </AppCard>

      {/* Warning on missing Cloud database */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 leading-relaxed text-center">
        💡 This workspace operates locally. When live Firebase is unconfigured, all submissions write into a local sandbox database state so you can test features safely.
      </div>
    </div>
  );
};
export default RegisterPage;
