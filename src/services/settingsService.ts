/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { SystemSettings } from '../types';
import { 
  getDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'settings';
const DEFAULT_DOC_ID = 'global_config';

const DEFAULT_SETTINGS: SystemSettings = {
  id: DEFAULT_DOC_ID,
  registrationOpen: true,
  allowManualCompany: true,
  allowMarketingArea: true,
  showEventDateQuestion: true,
  defaultLanguage: 'th',
  allowOtherCategory: true,
  // legacy backward compat
  maxCompanies: 50,
  eventYear: '2026',
  announcementTH: 'ระบบลงทะเบียนบูธจัดแสดงงานนิทรรศการหางาน Bangkok University Job Fair ประจำปี 2026 เปิดอย่างเป็นทางการ สำหรับบริษัททุกขนาดแล้ววันนี้!',
  announcementEN: 'General Corporate Booth registration is now officially active for the upcoming annual Bangkok University Job Fair (BU Job Fair 2026).',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  updatedBy: 'system'
};

let sandboxSettings: SystemSettings = { ...DEFAULT_SETTINGS };

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    if (!isFirebaseConfigured) {
      return { ...sandboxSettings };
    }
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, DEFAULT_DOC_ID));
      if (snap.exists()) {
        const d = snap.data();
        return {
          id: snap.id,
          registrationOpen: d.registrationOpen ?? true,
          allowManualCompany: d.allowManualCompany ?? true,
          allowMarketingArea: d.allowMarketingArea ?? true,
          showEventDateQuestion: d.showEventDateQuestion ?? true,
          defaultLanguage: d.defaultLanguage || 'th',
          allowOtherCategory: d.allowOtherCategory ?? true,
          maxCompanies: d.maxCompanies ?? 50,
          eventYear: d.eventYear || '2026',
          announcementTH: d.announcementTH || '',
          announcementEN: d.announcementEN || '',
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt || new Date(),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt || new Date(),
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as SystemSettings;
      }
      // Populate defaults on Firestore if empty
      await this.saveSettings(DEFAULT_SETTINGS, 'system');
      return { ...DEFAULT_SETTINGS };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${DEFAULT_DOC_ID}`);
      return { ...DEFAULT_SETTINGS };
    }
  },

  async saveSettings(settings: Omit<SystemSettings, 'id'>, operatorEmail: string): Promise<boolean> {
    const raw = {
      ...settings,
      updatedAt: new Date(),
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      sandboxSettings = { id: DEFAULT_DOC_ID, ...sandboxSettings, ...raw };
      return true;
    }
    try {
      await setDoc(doc(db, COLLECTION_NAME, DEFAULT_DOC_ID), {
        registrationOpen: settings.registrationOpen ?? true,
        allowManualCompany: settings.allowManualCompany ?? true,
        allowMarketingArea: settings.allowMarketingArea ?? true,
        showEventDateQuestion: settings.showEventDateQuestion ?? true,
        defaultLanguage: settings.defaultLanguage || 'th',
        allowOtherCategory: settings.allowOtherCategory ?? true,
        maxCompanies: settings.maxCompanies ?? 50,
        eventYear: settings.eventYear || '2026',
        announcementTH: settings.announcementTH || '',
        announcementEN: settings.announcementEN || '',
        updatedAt: serverTimestamp(),
        updatedBy: operatorEmail
      }, { merge: true });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTION_NAME}/${DEFAULT_DOC_ID}`);
      return false;
    }
  }
};
export default settingsService;
