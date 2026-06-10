/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { EventDate } from '../types';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query,
  where,
  limit,
  startAfter,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'eventDates';

let sandboxEventDates: EventDate[] = [
  {
    id: 'ed_01',
    eventDate: new Date('2026-11-12T09:00:00Z'),
    eventNameTH: 'บูธออนไลน์และนิทรรศการนวัตกรรม (วันแรก)',
    eventNameEN: 'On-site Corporate Exhibition (Day 1)',
    isActive: true,
    maxCapacity: 35,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'ed_02',
    eventDate: new Date('2026-11-13T09:00:00Z'),
    eventNameTH: 'นิทรรศการบุคลากรและการเจรจาธุรกิจ (วันที่สอง)',
    eventNameEN: 'Career Recruitment & Placement Partnering (Day 2)',
    isActive: true,
    maxCapacity: 35,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

export const eventDateService = {
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filters?: { isActive?: boolean }
  ): Promise<{ data: EventDate[]; lastDoc: any }> {
    if (!isFirebaseConfigured) {
      let filtered = [...sandboxEventDates].sort((a,b) => new Date(a.eventDate as Date).getTime() - new Date(b.eventDate as Date).getTime());
      if (filters?.isActive !== undefined) {
        filtered = filtered.filter(ed => ed.isActive === filters.isActive);
      }
      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('eventDate', 'asc')];
      
      if (filters?.isActive !== undefined) {
        constraints.push(where('isActive', '==', filters.isActive));
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
          eventDate: d.eventDate instanceof Timestamp ? d.eventDate.toDate() : d.eventDate,
          eventNameTH: d.eventNameTH || '',
          eventNameEN: d.eventNameEN || '',
          isActive: d.isActive ?? true,
          maxCapacity: d.maxCapacity || 0,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as EventDate;
      });

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  async getById(id: string): Promise<EventDate | null> {
    if (!isFirebaseConfigured) {
      return sandboxEventDates.find(ed => ed.id === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        eventDate: d.eventDate instanceof Timestamp ? d.eventDate.toDate() : d.eventDate,
        eventNameTH: d.eventNameTH || '',
        eventNameEN: d.eventNameEN || '',
        isActive: d.isActive ?? true,
        maxCapacity: d.maxCapacity || 0,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as EventDate;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${id}`);
      return null;
    }
  },

  subscribe(callback: (dates: EventDate[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxEventDates].sort((a,b) => new Date(a.eventDate as Date).getTime() - new Date(b.eventDate as Date).getTime()));
      return () => {};
    }
    const q = query(collection(db, COLLECTION_NAME), orderBy('eventDate', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          eventDate: d.eventDate instanceof Timestamp ? d.eventDate.toDate() : d.eventDate,
          eventNameTH: d.eventNameTH || '',
          eventNameEN: d.eventNameEN || '',
          isActive: d.isActive ?? true,
          maxCapacity: d.maxCapacity || 0,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as EventDate;
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  async create(date: Omit<EventDate, 'id' | 'createdAt' | 'updatedAt'>, operatorEmail: string): Promise<EventDate> {
    const raw: EventDate = {
      ...date,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'ed_' + Math.random().toString(36).substr(2, 9);
      const saved = { ...raw, id: generatedId };
      sandboxEventDates.push(saved);
      return saved;
    }

    try {
      const ref = await addDoc(collection(db, COLLECTION_NAME), {
        ...date,
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

  async update(id: string, updates: Partial<EventDate>, operatorEmail: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const idx = sandboxEventDates.findIndex(ed => ed.id === id);
      if (idx !== -1) {
        sandboxEventDates[idx] = {
          ...sandboxEventDates[idx],
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
      sandboxEventDates = sandboxEventDates.filter(ed => ed.id !== id);
      return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
