/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured, auth } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { Registration } from '../types';
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

const COLLECTION_NAME = 'registrations';

const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'reg_01',
    registrationNumber: 'BUJF-2026-000001',
    companyNameTH: 'บริษัท จี-เทค ดิจิทัล โซลูชันส์ จำกัด',
    companyNameEN: 'G-Tech Digital Solutions Co., Ltd.',
    coordinatorName: 'สมชาย รักเทคโนโลยี',
    position: 'HR Manager',
    phone: '02-123-4567',
    email: 'hr@g-tech.example.com',
    lineId: 'gtech_hr',
    businessCategoryId: 'bc_tech',
    businessCategoryNameTH: 'เทคโนโลยีและดิจิทัล',
    businessCategoryNameEN: 'Technology & Digital',
    eventDateId: 'ed_01',
    logoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=200&h=200',
    staffCount: 4,
    parkingCount: 2,
    hasBUICJobs: true,
    hasFreelance: false,
    marketingAreaRequested: true,
    status: 'approved',
    submittedAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
    approvedAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
    assignedBoothId: 'A01',
    assignedBoothCode: 'A01',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2),
    updatedAt: new Date(Date.now() - 3600000 * 24),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'reg_02',
    registrationNumber: 'BUJF-2026-000002',
    companyNameTH: 'บางกอก มีเดีย แอดเวอร์ไทซิ่ง กรุ๊ป',
    companyNameEN: 'Bangkok Media Advertising Group',
    coordinatorName: 'สมศรี มีดีไซน์',
    position: 'PR Director',
    phone: '081-987-6543',
    email: 'contact@bmg-media.example.com',
    lineId: 'bmg_pr',
    businessCategoryId: 'bc_mkt',
    businessCategoryNameTH: 'การตลาดและการโฆษณา',
    businessCategoryNameEN: 'Marketing & Digital Advertising',
    eventDateId: 'ed_02',
    logoUrl: '',
    staffCount: 3,
    parkingCount: 1,
    hasBUICJobs: false,
    hasFreelance: true,
    marketingAreaRequested: false,
    status: 'pending',
    submittedAt: new Date(Date.now() - 3600000), // 1 hour ago
    approvedAt: null,
    assignedBoothId: null,
    assignedBoothCode: null,
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

let sandboxRegistrations: Registration[] = [...INITIAL_REGISTRATIONS];

export const registrationService = {
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filters?: { status?: string; businessCategoryId?: string; eventDateId?: string }
  ): Promise<{ data: Registration[]; lastDoc: any }> {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      let filtered = [...sandboxRegistrations].sort((a,b) => b.submittedAt.toString().localeCompare(a.submittedAt.toString()));
      if (filters?.status) {
        filtered = filtered.filter(r => r.status === filters.status);
      }
      if (filters?.businessCategoryId) {
        filtered = filtered.filter(r => r.businessCategoryId === filters.businessCategoryId);
      }
      if (filters?.eventDateId) {
        filtered = filtered.filter(r => r.eventDateId === filters.eventDateId);
      }
      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('submittedAt', 'desc')];
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.businessCategoryId) {
        constraints.push(where('businessCategoryId', '==', filters.businessCategoryId));
      }
      if (filters?.eventDateId) {
        constraints.push(where('eventDateId', '==', filters.eventDateId));
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
          registrationNumber: d.registrationNumber || '',
          companyNameTH: d.companyNameTH || '',
          companyNameEN: d.companyNameEN || '',
          coordinatorName: d.coordinatorName || '',
          position: d.position || '',
          phone: d.phone || '',
          email: d.email || '',
          lineId: d.lineId || '',
          businessCategoryId: d.businessCategoryId || '',
          businessCategoryNameTH: d.businessCategoryNameTH || '',
          businessCategoryNameEN: d.businessCategoryNameEN || '',
          eventDateId: d.eventDateId || '',
          logoUrl: d.logoUrl || '',
          staffCount: d.staffCount || 0,
          parkingCount: d.parkingCount || 0,
          hasBUICJobs: d.hasBUICJobs ?? false,
          hasFreelance: d.hasFreelance ?? false,
          marketingAreaRequested: d.marketingAreaRequested ?? false,
          status: d.status || 'pending',
          submittedAt: d.submittedAt instanceof Timestamp ? d.submittedAt.toDate() : d.submittedAt,
          approvedAt: d.approvedAt instanceof Timestamp ? d.approvedAt.toDate() : d.approvedAt || null,
          assignedBoothId: d.assignedBoothId || null,
          assignedBoothCode: d.assignedBoothCode || null,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as Registration;
      });

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  async getById(id: string): Promise<Registration | null> {
    if (!isFirebaseConfigured) {
      return sandboxRegistrations.find(r => r.id === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        registrationNumber: d.registrationNumber || '',
        companyNameTH: d.companyNameTH || '',
        companyNameEN: d.companyNameEN || '',
        coordinatorName: d.coordinatorName || '',
        position: d.position || '',
        phone: d.phone || '',
        email: d.email || '',
        lineId: d.lineId || '',
        businessCategoryId: d.businessCategoryId || '',
        businessCategoryNameTH: d.businessCategoryNameTH || '',
        businessCategoryNameEN: d.businessCategoryNameEN || '',
        eventDateId: d.eventDateId || '',
        logoUrl: d.logoUrl || '',
        staffCount: d.staffCount || 0,
        parkingCount: d.parkingCount || 0,
        hasBUICJobs: d.hasBUICJobs ?? false,
        hasFreelance: d.hasFreelance ?? false,
        marketingAreaRequested: d.marketingAreaRequested ?? false,
        status: d.status || 'pending',
        submittedAt: d.submittedAt instanceof Timestamp ? d.submittedAt.toDate() : d.submittedAt,
        approvedAt: d.approvedAt instanceof Timestamp ? d.approvedAt.toDate() : d.approvedAt || null,
        assignedBoothId: d.assignedBoothId || null,
        assignedBoothCode: d.assignedBoothCode || null,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as Registration;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${id}`);
      return null;
    }
  },

  subscribe(callback: (registrations: Registration[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      callback([...sandboxRegistrations]);
      return () => {};
    }
    const q = query(collection(db, COLLECTION_NAME), orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          registrationNumber: d.registrationNumber || '',
          companyNameTH: d.companyNameTH || '',
          companyNameEN: d.companyNameEN || '',
          coordinatorName: d.coordinatorName || '',
          position: d.position || '',
          phone: d.phone || '',
          email: d.email || '',
          lineId: d.lineId || '',
          businessCategoryId: d.businessCategoryId || '',
          businessCategoryNameTH: d.businessCategoryNameTH || '',
          businessCategoryNameEN: d.businessCategoryNameEN || '',
          eventDateId: d.eventDateId || '',
          logoUrl: d.logoUrl || '',
          staffCount: d.staffCount || 0,
          parkingCount: d.parkingCount || 0,
          hasBUICJobs: d.hasBUICJobs ?? false,
          hasFreelance: d.hasFreelance ?? false,
          marketingAreaRequested: d.marketingAreaRequested ?? false,
          status: d.status || 'pending',
          submittedAt: d.submittedAt instanceof Timestamp ? d.submittedAt.toDate() : d.submittedAt,
          approvedAt: d.approvedAt instanceof Timestamp ? d.approvedAt.toDate() : d.approvedAt || null,
          assignedBoothId: d.assignedBoothId || null,
          assignedBoothCode: d.assignedBoothCode || null,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as Registration;
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  async create(reg: Omit<Registration, 'id' | 'createdAt' | 'updatedAt'>, operatorEmail: string): Promise<Registration> {
    const raw: Registration = {
      ...reg,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'reg_' + Math.random().toString(36).substr(2, 9);
      const saved = { ...raw, id: generatedId };
      sandboxRegistrations.push(saved);
      return saved;
    }

    try {
      const ref = await addDoc(collection(db, COLLECTION_NAME), {
        ...reg,
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

  async update(id: string, updates: Partial<Registration>, operatorEmail: string): Promise<boolean> {
    if (!isFirebaseConfigured) {
      const idx = sandboxRegistrations.findIndex(r => r.id === id);
      if (idx === -1) return false;
      sandboxRegistrations[idx] = {
        ...sandboxRegistrations[idx],
        ...updates,
        updatedAt: new Date(),
        updatedBy: operatorEmail
      };
      return true;
    }

    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: operatorEmail
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isFirebaseConfigured) {
      const idx = sandboxRegistrations.findIndex(r => r.id === id);
      if (idx === -1) return false;
      sandboxRegistrations.splice(idx, 1);
      return true;
    }

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
      return false;
    }
  },

  async hydrateDefaults() {
    if (!isFirebaseConfigured) return;
    try {
      for (const r of INITIAL_REGISTRATIONS) {
        await setDoc(doc(db, COLLECTION_NAME, r.id!), {
          registrationNumber: r.registrationNumber,
          companyNameTH: r.companyNameTH,
          companyNameEN: r.companyNameEN,
          coordinatorName: r.coordinatorName,
          position: r.position,
          phone: r.phone,
          email: r.email,
          lineId: r.lineId,
          businessCategoryId: r.businessCategoryId,
          businessCategoryNameTH: r.businessCategoryNameTH,
          businessCategoryNameEN: r.businessCategoryNameEN,
          eventDateId: r.eventDateId,
          logoUrl: r.logoUrl,
          staffCount: r.staffCount,
          parkingCount: r.parkingCount,
          hasBUICJobs: r.hasBUICJobs,
          hasFreelance: r.hasFreelance,
          marketingAreaRequested: r.marketingAreaRequested,
          status: r.status,
          submittedAt: r.submittedAt,
          approvedAt: r.approvedAt,
          assignedBoothId: r.assignedBoothId,
          assignedBoothCode: r.assignedBoothCode,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: 'system',
          updatedBy: 'system'
        });
      }
    } catch (e) {
      console.error('Failed to pre-populate default registrations:', e);
    }
  }
};
export default registrationService;
