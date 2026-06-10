/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { EmailTemplate } from '../types';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc,
  query,
  where,
  limit,
  startAfter,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'emailTemplates';

let sandboxTemplates: EmailTemplate[] = [
  {
    id: 'temp_welcome',
    templateCode: 'WELCOME',
    templateName: 'ใบลงทะเบียนและตอบรับเข้าร่วมงาน',
    subjectTH: 'ได้รับการลงทะเบียนเข้าร่วมงาน BU Job Fair 2026 สำเร็จ',
    subjectEN: 'Successfully Registered for BU Job Fair 2026',
    bodyTH: 'เรียน คุณ {{coordinatorName}},\n\nบริษัท {{companyNameTH}} ได้ลงทะเบียนเรียบร้อยแล้ว รหัสของท่านคือ {{registrationNumber}}\n\nขอแสดงความนับถือ,\nผู้ประสานงานมหาวิทยาลัยกรุงเทพ',
    bodyEN: 'Dear {{coordinatorName}},\n\nWe have successfully registered {{companyNameEN}}. Your reference is {{registrationNumber}}.\n\nBest Regards,\nBangkok University team',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

export const emailTemplateService = {
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filters?: { active?: boolean }
  ): Promise<{ data: EmailTemplate[]; lastDoc: any }> {
    if (!isFirebaseConfigured) {
      let filtered = [...sandboxTemplates].sort((a,b) => a.templateCode.localeCompare(b.templateCode));
      if (filters?.active !== undefined) {
        filtered = filtered.filter(t => t.active === filters.active);
      }
      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('templateCode', 'asc')];
      
      if (filters?.active !== undefined) {
        constraints.push(where('active', '==', filters.active));
      }
      if (limitCount) {
        constraints.push(limit(limitCount));
      }
      if (lastVisibleDoc) {
        constraints.push(startAfter(lastVisibleDoc));
      }

      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      const qSnap = await getDocs(q);
      const lastDoc = qSnap.docs[qSnap.docs.length - 1] || null;

      const data = qSnap.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          templateCode: d.templateCode || '',
          templateName: d.templateName || '',
          subjectTH: d.subjectTH || '',
          subjectEN: d.subjectEN || '',
          bodyTH: d.bodyTH || '',
          bodyEN: d.bodyEN || '',
          active: d.active ?? true,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as EmailTemplate;
      });

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  async getById(id: string): Promise<EmailTemplate | null> {
    if (!isFirebaseConfigured) {
      return sandboxTemplates.find(t => t.id === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        templateCode: d.templateCode || '',
        templateName: d.templateName || '',
        subjectTH: d.subjectTH || '',
        subjectEN: d.subjectEN || '',
        bodyTH: d.bodyTH || '',
        bodyEN: d.bodyEN || '',
        active: d.active ?? true,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as EmailTemplate;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${id}`);
      return null;
    }
  },

  async getByCode(templateCode: string): Promise<EmailTemplate | null> {
    if (!isFirebaseConfigured) {
      return sandboxTemplates.find(t => t.templateCode === templateCode) || null;
    }
    try {
      const q = query(collection(db, COLLECTION_NAME), where('templateCode', '==', templateCode));
      const qSnap = await getDocs(q);
      if (qSnap.empty) return null;
      const docSnap = qSnap.docs[0];
      const d = docSnap.data();
      return {
        id: docSnap.id,
        templateCode: d.templateCode || '',
        templateName: d.templateName || '',
        subjectTH: d.subjectTH || '',
        subjectEN: d.subjectEN || '',
        bodyTH: d.bodyTH || '',
        bodyEN: d.bodyEN || '',
        active: d.active ?? true,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as EmailTemplate;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  subscribe(callback: (templates: EmailTemplate[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxTemplates]);
      return () => {};
    }
    const q = query(collection(db, COLLECTION_NAME), orderBy('templateCode', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          templateCode: d.templateCode || '',
          templateName: d.templateName || '',
          subjectTH: d.subjectTH || '',
          subjectEN: d.subjectEN || '',
          bodyTH: d.bodyTH || '',
          bodyEN: d.bodyEN || '',
          active: d.active ?? true,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as EmailTemplate;
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  async create(tpl: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>, operatorEmail: string): Promise<EmailTemplate> {
    const raw: EmailTemplate = {
      ...tpl,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'temp_' + Math.random().toString(36).substr(2, 9);
      const saved = { ...raw, id: generatedId };
      sandboxTemplates.push(saved);
      return saved;
    }

    try {
      const ref = await addDoc(collection(db, COLLECTION_NAME), {
        ...tpl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: operatorEmail,
        updatedBy: operatorEmail
      });
      return { ...raw, id: ref.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
      return raw;
    }
  },

  async update(id: string, updates: Partial<EmailTemplate>, operatorEmail: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const idx = sandboxTemplates.findIndex(t => t.id === id);
      if (idx !== -1) {
        sandboxTemplates[idx] = {
          ...sandboxTemplates[idx],
          ...updates,
          updatedAt: new Date(),
          updatedBy: operatorEmail
        };
      }
      return;
    }

    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: operatorEmail
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isFirebaseConfigured) {
      sandboxTemplates = sandboxTemplates.filter(t => t.id !== id);
      return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
