/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { Booth } from '../types';
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

const COLLECTION_NAME = 'booths';

const INITIAL_BOOTHS: Booth[] = [
  { 
    id: 'A01', 
    boothCode: 'A01', 
    zone: 'Zone A (Premium)', 
    size: '3x3m', 
    status: 'reserved', 
    remarks: 'Allocated to G-Tech',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  { 
    id: 'A02', 
    boothCode: 'A02', 
    zone: 'Zone A (Premium)', 
    size: '3x3m', 
    status: 'available', 
    remarks: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  { 
    id: 'A03', 
    boothCode: 'A03', 
    zone: 'Zone A (Premium)', 
    size: '3x3m', 
    status: 'available', 
    remarks: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  { 
    id: 'B01', 
    boothCode: 'B01', 
    zone: 'Zone B (Standard)', 
    size: '3x3m', 
    status: 'reserved', 
    remarks: 'Allocated to Alumni Group',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  { 
    id: 'B02', 
    boothCode: 'B02', 
    zone: 'Zone B (Standard)', 
    size: '3x3m', 
    status: 'available', 
    remarks: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  { 
    id: 'B03', 
    boothCode: 'B03', 
    zone: 'Zone B (Standard)', 
    size: '3x3m', 
    status: 'available', 
    remarks: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

let sandboxBooths: Booth[] = [...INITIAL_BOOTHS];

export const boothService = {
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filters?: { zone?: string; status?: 'available' | 'reserved' | 'occupied' }
  ): Promise<{ data: Booth[]; lastDoc: any }> {
    if (!isFirebaseConfigured) {
      let filtered = [...sandboxBooths].sort((a,b) => a.boothCode.localeCompare(b.boothCode));
      if (filters?.zone) {
        filtered = filtered.filter(b => b.zone === filters.zone);
      }
      if (filters?.status) {
        filtered = filtered.filter(b => b.status === filters.status);
      }
      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('boothCode', 'asc')];
      
      if (filters?.zone) {
        constraints.push(where('zone', '==', filters.zone));
      }
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
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
          boothCode: d.boothCode || docSnap.id,
          zone: d.zone || '',
          size: d.size || '3x3m',
          status: d.status || 'available',
          remarks: d.remarks || '',
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as Booth;
      });

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  async getById(id: string): Promise<Booth | null> {
    if (!isFirebaseConfigured) {
      return sandboxBooths.find(b => b.id === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        boothCode: d.boothCode || docSnap.id,
        zone: d.zone || '',
        size: d.size || '3x3m',
        status: d.status || 'available',
        remarks: d.remarks || '',
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as Booth;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${id}`);
      return null;
    }
  },

  subscribe(callback: (booths: Booth[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxBooths].sort((a,b) => a.boothCode.localeCompare(b.boothCode)));
      return () => {};
    }
    const q = query(collection(db, COLLECTION_NAME), orderBy('boothCode', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          boothCode: d.boothCode || docSnap.id,
          zone: d.zone || '',
          size: d.size || '3x3m',
          status: d.status || 'available',
          remarks: d.remarks || '',
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as Booth;
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  async create(booth: Omit<Booth, 'id' | 'createdAt' | 'updatedAt'>, operatorEmail: string): Promise<Booth> {
    const raw: Booth = {
      ...booth,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = booth.boothCode;
      const saved = { ...raw, id: generatedId };
      sandboxBooths.push(saved);
      return saved;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, booth.boothCode);
      await setDoc(docRef, {
        boothCode: booth.boothCode,
        zone: booth.zone,
        size: booth.size,
        status: booth.status,
        remarks: booth.remarks,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: operatorEmail,
        updatedBy: operatorEmail
      });
      return { ...raw, id: booth.boothCode };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
      return raw;
    }
  },

  async update(id: string, updates: Partial<Booth>, operatorEmail: string): Promise<boolean> {
    if (!isFirebaseConfigured) {
      const idx = sandboxBooths.findIndex(b => b.id === id);
      if (idx === -1) return false;
      sandboxBooths[idx] = {
        ...sandboxBooths[idx],
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
      const idx = sandboxBooths.findIndex(b => b.id === id);
      if (idx === -1) return false;
      sandboxBooths.splice(idx, 1);
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
      for (const b of INITIAL_BOOTHS) {
        await setDoc(doc(db, COLLECTION_NAME, b.boothCode), {
          boothCode: b.boothCode,
          zone: b.zone,
          size: b.size,
          status: b.status,
          remarks: b.remarks
        });
      }
    } catch (e) {
      console.error('Failed to pre-populate default booths into Firestore:', e);
    }
  }
};
