/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { SystemCounter } from '../types';
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
  runTransaction,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'systemCounters';

let sandboxCounters: SystemCounter[] = [
  {
    id: 'sc_reg',
    counterName: 'registration',
    currentValue: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

export const counterService = {
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any
  ): Promise<{ data: SystemCounter[]; lastDoc: any }> {
    if (!isFirebaseConfigured) {
      return { data: [...sandboxCounters], lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('counterName', 'asc')];
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
          counterName: d.counterName || '',
          currentValue: d.currentValue || 0,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as SystemCounter;
      });

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  async getByName(counterName: string): Promise<SystemCounter | null> {
    if (!isFirebaseConfigured) {
      return sandboxCounters.find(c => c.counterName === counterName) || null;
    }
    try {
      const docRef = doc(db, COLLECTION_NAME, counterName);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        counterName: d.counterName,
        currentValue: d.currentValue,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as SystemCounter;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${counterName}`);
      return null;
    }
  },

  subscribe(callback: (counters: SystemCounter[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxCounters]);
      return () => {};
    }
    const q = query(collection(db, COLLECTION_NAME), orderBy('counterName', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          counterName: d.counterName,
          currentValue: d.currentValue,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as SystemCounter;
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  async create(counter: Omit<SystemCounter, 'id' | 'createdAt' | 'updatedAt'>, operatorEmail: string): Promise<SystemCounter> {
    const raw: SystemCounter = {
      ...counter,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = counter.counterName;
      const saved = { ...raw, id: generatedId };
      sandboxCounters.push(saved);
      return saved;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, counter.counterName);
      await setDoc(docRef, {
        counterName: counter.counterName,
        currentValue: counter.currentValue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: operatorEmail,
        updatedBy: operatorEmail
      });
      return { ...raw, id: counter.counterName };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
      return raw;
    }
  },

  async update(id: string, updates: Partial<SystemCounter>, operatorEmail: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const idx = sandboxCounters.findIndex(c => c.id === id);
      if (idx !== -1) {
        sandboxCounters[idx] = {
          ...sandboxCounters[idx],
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
      sandboxCounters = sandboxCounters.filter(c => c.id !== id);
      return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Atomic sequence generator using standard transaction to guarantee 0 overlaps
   */
  async getNextSequence(counterName: string, operatorEmail: string): Promise<number> {
    if (!isFirebaseConfigured) {
      const idx = sandboxCounters.findIndex(c => c.counterName === counterName);
      if (idx === -1) {
        sandboxCounters.push({
          id: counterName,
          counterName,
          currentValue: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: operatorEmail,
          updatedBy: operatorEmail
        });
        return 1;
      } else {
        sandboxCounters[idx].currentValue += 1;
        sandboxCounters[idx].updatedAt = new Date();
        sandboxCounters[idx].updatedBy = operatorEmail;
        return sandboxCounters[idx].currentValue;
      }
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, counterName);
      return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          transaction.set(docRef, {
            counterName,
            currentValue: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: operatorEmail,
            updatedBy: operatorEmail
          });
          return 1;
        } else {
          const currentVal = snap.data().currentValue || 0;
          const nextVal = currentVal + 1;
          transaction.update(docRef, {
            currentValue: nextVal,
            updatedAt: serverTimestamp(),
            updatedBy: operatorEmail
          });
          return nextVal;
        }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${counterName}`);
      throw err;
    }
  }
};
