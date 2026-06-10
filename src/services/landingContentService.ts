/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { LandingContent } from '../types';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { auditService } from './auditService';

const COLLECTION_NAME = 'landingContent';
const DOCUMENT_ID = 'homepage';

const DEFAULT_HOMEPAGE: LandingContent = {
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
};

export const landingContentService = {
  /**
   * Get homepage content
   */
  async getHomepage(): Promise<LandingContent> {
    if (!isFirebaseConfigured) {
      const saved = localStorage.getItem('bu_sandbox_landing_content');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_HOMEPAGE,
            ...parsed,
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
          };
        } catch {
          return { ...DEFAULT_HOMEPAGE };
        }
      }
      return { ...DEFAULT_HOMEPAGE };
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          heroTitleTH: d.heroTitleTH || '',
          heroTitleEN: d.heroTitleEN || '',
          heroDescriptionTH: d.heroDescriptionTH || '',
          heroDescriptionEN: d.heroDescriptionEN || '',
          registerButtonTextTH: d.registerButtonTextTH || '',
          registerButtonTextEN: d.registerButtonTextEN || '',
          heroImageUrl: d.heroImageUrl || '',
          showHeroImage: d.showHeroImage ?? true,
          contactEmail: d.contactEmail || '',
          contactPhone: d.contactPhone || '',
          footerTextTH: d.footerTextTH || '',
          footerTextEN: d.footerTextEN || '',
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt ? new Date(d.updatedAt) : new Date()
        } as LandingContent;
      } else {
        // Hydrate defaults in background or return defaults
        return { ...DEFAULT_HOMEPAGE };
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${DOCUMENT_ID}`);
      return { ...DEFAULT_HOMEPAGE };
    }
  },

  /**
   * Subscribe to homepage content in real time
   */
  subscribe(callback: (content: LandingContent) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      const saved = localStorage.getItem('bu_sandbox_landing_content');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          callback({
            ...DEFAULT_HOMEPAGE,
            ...parsed,
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
          });
        } catch {
          callback({ ...DEFAULT_HOMEPAGE });
        }
      } else {
        callback({ ...DEFAULT_HOMEPAGE });
      }
      return () => {};
    }

    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        callback({
          id: docSnap.id,
          heroTitleTH: d.heroTitleTH || '',
          heroTitleEN: d.heroTitleEN || '',
          heroDescriptionTH: d.heroDescriptionTH || '',
          heroDescriptionEN: d.heroDescriptionEN || '',
          registerButtonTextTH: d.registerButtonTextTH || '',
          registerButtonTextEN: d.registerButtonTextEN || '',
          heroImageUrl: d.heroImageUrl || '',
          showHeroImage: d.showHeroImage ?? true,
          contactEmail: d.contactEmail || '',
          contactPhone: d.contactPhone || '',
          footerTextTH: d.footerTextTH || '',
          footerTextEN: d.footerTextEN || '',
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt ? new Date(d.updatedAt) : new Date()
        } as LandingContent);
      } else {
        callback({ ...DEFAULT_HOMEPAGE });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${DOCUMENT_ID}`);
      if (onError) onError(err);
    });
  },

  /**
   * Update homepage content
   */
  async updateHomepage(updates: Partial<LandingContent>, operatorEmail: string): Promise<void> {
    const logDetails = `Update Homepage Content (keys: ${Object.keys(updates).join(', ')})`;
    
    if (!isFirebaseConfigured) {
      const current = await this.getHomepage();
      const next = {
        ...current,
        ...updates,
        updatedAt: new Date()
      };
      localStorage.setItem('bu_sandbox_landing_content', JSON.stringify(next));
      await auditService.logAction('Update Homepage Content', operatorEmail, DOCUMENT_ID, 'LandingContent', logDetails);
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      await setDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await auditService.logAction('Update Homepage Content', operatorEmail, DOCUMENT_ID, 'LandingContent', logDetails);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${DOCUMENT_ID}`);
    }
  }
};
