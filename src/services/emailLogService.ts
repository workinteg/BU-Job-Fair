/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { EmailLog } from '../types';
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

const COLLECTION_NAME = 'emailLogs';

let sandboxEmailLogs: EmailLog[] = [
  {
    id: 'el_01',
    emailQueueId: 'eq_01',
    recipientEmail: 'hr@g-tech.example.com',
    status: 'sent',
    opened: true,
    openedAt: new Date(Date.now() - 3600000 * 5),
    createdAt: new Date(Date.now() - 3600000 * 6),
    updatedAt: new Date(Date.now() - 3600000 * 5),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

export const emailLogService = {
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filters?: { status?: string; recipientEmail?: string }
  ): Promise<{ data: EmailLog[]; lastDoc: any }> {
    if (!isFirebaseConfigured) {
      let filtered = [...sandboxEmailLogs].sort((a,b) => b.createdAt.toString().localeCompare(a.createdAt.toString()));
      if (filters?.status) {
        filtered = filtered.filter(l => l.status === filters.status);
      }
      if (filters?.recipientEmail) {
        filtered = filtered.filter(l => l.recipientEmail.toLowerCase().includes(filters.recipientEmail!.toLowerCase()));
      }
      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('createdAt', 'desc')];
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

      let data = qSnap.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          emailQueueId: d.emailQueueId || '',
          recipientEmail: d.recipientEmail || '',
          status: d.status || '',
          opened: d.opened ?? false,
          openedAt: d.openedAt instanceof Timestamp ? d.openedAt.toDate() : d.openedAt || null,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as EmailLog;
      });

      if (filters?.recipientEmail) {
        const needle = filters.recipientEmail.toLowerCase();
        data = data.filter(l => l.recipientEmail.toLowerCase().includes(needle));
      }

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  async getById(id: string): Promise<EmailLog | null> {
    if (!isFirebaseConfigured) {
      return sandboxEmailLogs.find(l => l.id === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        emailQueueId: d.emailQueueId || '',
        recipientEmail: d.recipientEmail || '',
        status: d.status || '',
        opened: d.opened ?? false,
        openedAt: d.openedAt instanceof Timestamp ? d.openedAt.toDate() : d.openedAt || null,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as EmailLog;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${id}`);
      return null;
    }
  },

  subscribe(callback: (logs: EmailLog[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxEmailLogs]);
      return () => {};
    }
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          emailQueueId: d.emailQueueId || '',
          recipientEmail: d.recipientEmail || '',
          status: d.status || '',
          opened: d.opened ?? false,
          openedAt: d.openedAt instanceof Timestamp ? d.openedAt.toDate() : d.openedAt || null,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as EmailLog;
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  async create(log: Omit<EmailLog, 'id' | 'createdAt' | 'updatedAt'>, operatorEmail: string): Promise<EmailLog> {
    const raw: EmailLog = {
      ...log,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'el_' + Math.random().toString(36).substr(2, 9);
      const saved = { ...raw, id: generatedId };
      sandboxEmailLogs.push(saved);
      return saved;
    }

    try {
      const ref = await addDoc(collection(db, COLLECTION_NAME), {
        ...log,
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

  async update(id: string, updates: Partial<EmailLog>, operatorEmail: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const idx = sandboxEmailLogs.findIndex(l => l.id === id);
      if (idx !== -1) {
        sandboxEmailLogs[idx] = {
          ...sandboxEmailLogs[idx],
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
      sandboxEmailLogs = sandboxEmailLogs.filter(l => l.id !== id);
      return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
export default emailLogService;
