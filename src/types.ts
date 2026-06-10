/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Timestamp } from 'firebase/firestore';

// Language definitions
export type Language = 'th' | 'en';

// Theme Configuration Interface
export interface ThemeConfig {
  colors: {
    primary: string; // BU Dark Blue: #003DA5
    secondary: string; // Slate background/light gray: #F4F6F8
    accent: string; // Bright Blue: #0077FF
    success: string; // Green: #00A86B
    warning: string; // Yellow/Amber: #FFB000
    danger: string; // Red: #E53935
  };
}

// ----------------------------------------------------
// 1. Admin
// ----------------------------------------------------
export interface Admin {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'superAdmin' | 'admin';
  active: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// For backward compatibility with existing code
export type AdminUser = Admin;

// ----------------------------------------------------
// 2. Announcement
// ----------------------------------------------------
export interface Announcement {
  id?: string;
  titleTH: string;
  titleEN: string;
  contentTH: string;
  contentEN: string;
  featuredImage?: string;
  isPublished: boolean;
  sortOrder: number;
  publishedAt?: Timestamp | Date | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// ----------------------------------------------------
// 3. CompanyMaster
// ----------------------------------------------------
export interface CompanyMaster {
  id?: string;
  companyCode: string;
  companyNameTH: string;
  companyNameEN: string;
  businessCategoryId: string | null;
  businessCategoryNameTH: string | null;
  businessCategoryNameEN: string | null;
  website: string;
  active: boolean;
  source: string;
  remarks: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;
  updatedBy: string;
}

// For backward compatibility with existing code
export interface Company {
  id: string;
  nameTH: string;
  nameEN: string;
  website?: string;
  contactEmail: string;
  contactPhone: string;
  categoryId: string;
  registeredAt: string;
  boothId?: string;
}

// ----------------------------------------------------
// 4. BusinessCategory
// ----------------------------------------------------
export interface BusinessCategory {
  id?: string;
  categoryCode: string;
  parentCode: string | null;
  level: number;
  categoryNameTH: string;
  categoryNameEN: string;
  fullNameTH: string;
  fullNameEN: string;
  sortOrder: number;
  active: boolean;
  allowCustomText: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;
  updatedBy: string;
}

// For backward compatibility with any files requesting Category
export interface Category {
  id: string;
  nameTH: string;
  nameEN: string;
  descriptionTH?: string;
  descriptionEN?: string;
}

// ----------------------------------------------------
// 5. EventDate
// ----------------------------------------------------
export interface EventDate {
  id?: string;
  eventDate: Timestamp | Date;
  eventNameTH: string;
  eventNameEN: string;
  isActive: boolean;
  maxCapacity: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// ----------------------------------------------------
// 6. Registration
// ----------------------------------------------------
export interface Registration {
  id?: string;
  registrationNumber: string;
  companyNameTH: string;
  companyNameEN: string;
  coordinatorName: string;
  position: string;
  phone: string;
  email: string;
  lineId: string;
  businessCategoryId: string;
  businessCategoryNameTH: string;
  businessCategoryNameEN: string;
  eventDateId: string;
  logoUrl: string;
  staffCount: number;
  parkingCount: number;
  hasBUICJobs: boolean;
  hasFreelance: boolean;
  marketingAreaRequested: boolean;
  status: string; // e.g., 'pending' | 'approved' | 'rejected'
  submittedAt: Timestamp | Date;
  approvedAt: Timestamp | Date | null;
  assignedBoothId: string | null;
  assignedBoothCode: string | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// ----------------------------------------------------
// 7. Booth
// ----------------------------------------------------
export interface Booth {
  id?: string;
  boothCode: string;
  zone: string;
  size: string;
  status: 'available' | 'reserved' | 'occupied';
  remarks: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// ----------------------------------------------------
// 8. EmailTemplate
// ----------------------------------------------------
export interface EmailTemplate {
  id?: string;
  templateCode?: string;
  templateName?: string;
  subjectTH: string;
  subjectEN: string;
  bodyTH: string;
  bodyEN: string;
  active?: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
  
  // Backward compatibility fields
  name?: string;
  type?: string;
}

// ----------------------------------------------------
// 9. EmailQueue
// ----------------------------------------------------
export interface EmailQueue {
  id?: string;
  registrationId: string;
  recipientEmail: string;
  templateCode: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  scheduledAt: Timestamp | Date;
  sentAt: Timestamp | Date | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// ----------------------------------------------------
// 10. EmailLog
// ----------------------------------------------------
export interface EmailLog {
  id?: string;
  emailQueueId?: string;
  recipientEmail?: string;
  status: string;
  opened?: boolean;
  openedAt?: Timestamp | Date | null;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
  
  // Backward compatibility fields
  recipient?: string;
  subject?: string;
  sentAt?: string | Timestamp | Date;
  templateId?: string;
}

// ----------------------------------------------------
// 11. AuditLog
// ----------------------------------------------------
export interface AuditLog {
  id?: string;
  action: string;
  userEmail: string;
  targetId: string;
  targetType: string;
  details: string;
  timestamp: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// ----------------------------------------------------
// 12. SystemSetting
// ----------------------------------------------------
export interface SystemSetting {
  id?: string;
  key: string;
  value: unknown;
  description: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// For older settings configuration backward compatibility
export interface SystemSettings {
  id: string;
  registrationOpen: boolean;
  allowManualCompany: boolean;
  allowMarketingArea: boolean;
  showEventDateQuestion: boolean;
  defaultLanguage: 'th' | 'en';
  maxCompanies: number;
  eventYear: string;
  announcementTH: string;
  announcementEN: string;
  allowOtherCategory?: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// ----------------------------------------------------
// 13. SystemCounter
// ----------------------------------------------------
export interface SystemCounter {
  id?: string;
  counterName: string;
  currentValue: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
  updatedBy?: string;
}

// ----------------------------------------------------
// 14. LandingContent
// ----------------------------------------------------
export interface LandingContent {
  id?: string;
  heroTitleTH: string;
  heroTitleEN: string;
  heroDescriptionTH: string;
  heroDescriptionEN: string;
  registerButtonTextTH: string;
  registerButtonTextEN: string;
  heroImageUrl: string;
  showHeroImage: boolean;
  contactEmail: string;
  contactPhone: string;
  footerTextTH: string;
  footerTextEN: string;
  updatedAt: Timestamp | Date;
}

