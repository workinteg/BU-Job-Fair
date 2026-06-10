/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { EmailQueue } from '../types';
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

const COLLECTION_NAME = 'emailQueue';

let sandboxQueue: EmailQueue[] = [
  {
    id: 'eq_01',
    registrationId: 'reg_01',
    recipientEmail: 'hr@g-tech.example.com',
    templateCode: 'WELCOME',
    subject: 'ได้รับการลงทะเบียนเข้าร่วมงาน BU Job Fair 2026 สำเร็จ',
    body: 'เรียน คุณ สมชาย รักเทคโนโลยี,\n\nบริษัท บริษัท จี-เทค ดิจิทัล โซลูชันส์ จำกัด ได้ลงทะเบียนเรียบร้อยแล้ว รหัสของท่านคือ BUJF-2026-000001\n\nขอแสดงความนับถือ,\nผู้ประสานงานมหาวิทยาลัยกรุงเทพ',
    status: 'sent',
    scheduledAt: new Date(),
    sentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

export const emailQueueService = {
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filters?: { status?: 'pending' | 'sent' | 'failed' }
  ): Promise<{ data: EmailQueue[]; lastDoc: any }> {
    if (!isFirebaseConfigured) {
      let filtered = [...sandboxQueue].sort((a,b) => b.scheduledAt.toString().localeCompare(a.scheduledAt.toString()));
      if (filters?.status) {
        filtered = filtered.filter(q => q.status === filters.status);
      }
      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('scheduledAt', 'desc')];
      
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
          registrationId: d.registrationId || '',
          recipientEmail: d.recipientEmail || '',
          templateCode: d.templateCode || '',
          subject: d.subject || '',
          body: d.body || '',
          status: d.status || 'pending',
          scheduledAt: d.scheduledAt instanceof Timestamp ? d.scheduledAt.toDate() : d.scheduledAt,
          sentAt: d.sentAt instanceof Timestamp ? d.sentAt.toDate() : d.sentAt || null,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as EmailQueue;
      });

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  async getById(id: string): Promise<EmailQueue | null> {
    if (!isFirebaseConfigured) {
      return sandboxQueue.find(q => q.id === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        registrationId: d.registrationId || '',
        recipientEmail: d.recipientEmail || '',
        templateCode: d.templateCode || '',
        subject: d.subject || '',
        body: d.body || '',
        status: d.status || 'pending',
        scheduledAt: d.scheduledAt instanceof Timestamp ? d.scheduledAt.toDate() : d.scheduledAt,
        sentAt: d.sentAt instanceof Timestamp ? d.sentAt.toDate() : d.sentAt || null,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as EmailQueue;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${id}`);
      return null;
    }
  },

  subscribe(callback: (queue: EmailQueue[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxQueue]);
      return () => {};
    }
    const q = query(collection(db, COLLECTION_NAME), orderBy('scheduledAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          registrationId: d.registrationId || '',
          recipientEmail: d.recipientEmail || '',
          templateCode: d.templateCode || '',
          subject: d.subject || '',
          body: d.body || '',
          status: d.status || 'pending',
          scheduledAt: d.scheduledAt instanceof Timestamp ? d.scheduledAt.toDate() : d.scheduledAt,
          sentAt: d.sentAt instanceof Timestamp ? d.sentAt.toDate() : d.sentAt || null,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as EmailQueue;
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  async create(item: Omit<EmailQueue, 'id' | 'createdAt' | 'updatedAt'>, operatorEmail: string): Promise<EmailQueue> {
    const raw: EmailQueue = {
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'eq_' + Math.random().toString(36).substr(2, 9);
      const saved = { ...raw, id: generatedId };
      sandboxQueue.push(saved);
      return saved;
    }

    try {
      const ref = await addDoc(collection(db, COLLECTION_NAME), {
        ...item,
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

  async update(id: string, updates: Partial<EmailQueue>, operatorEmail: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const idx = sandboxQueue.findIndex(q => q.id === id);
      if (idx !== -1) {
        sandboxQueue[idx] = {
          ...sandboxQueue[idx],
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
      sandboxQueue = sandboxQueue.filter(q => q.id !== id);
      return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
export default emailQueueService;
