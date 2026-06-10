/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { Announcement } from '../types';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  addDoc, 
  deleteDoc,
  updateDoc, 
  query, 
  where, 
  limit,
  startAfter,
  serverTimestamp,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { auditService } from './auditService';

const COLLECTION_NAME = 'announcements';

let sandboxAnnouncements: Announcement[] = [
  {
    id: 'ann_01',
    titleTH: 'ยินดีต้อนรับสู่ระบบลงทะเบียน BU Job Fair 2026',
    titleEN: 'Welcome to BU Job Fair 2026 Registration System',
    contentTH: '<p>ระบบลงทะเบียนผู้เข้าร่วมแสดงสินค้าของบริษัทและบูธความร่วมมือสถาบัน ได้เปิดรับลงทะเบียนอย่างเป็นทางการแล้ว</p>',
    contentEN: '<p>The registration portal for corporate booths and partnerships is now open.</p>',
    featuredImage: 'https://picsum.photos/800/400?random=1',
    isPublished: true,
    sortOrder: 1,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

export const announcementService = {
  /**
   * Fetch announcements (pagination and list filtering supported)
   */
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filterPublishedOnly?: boolean
  ): Promise<{ data: Announcement[]; lastDoc: any }> {
    if (!isFirebaseConfigured) {
      let filtered = [...sandboxAnnouncements].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date().getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date().getTime();
        return bTime - aTime;
      });
      if (filterPublishedOnly) {
        filtered = filtered.filter(a => a.isPublished);
      }
      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('sortOrder', 'asc'), orderBy('createdAt', 'desc')];
      
      if (filterPublishedOnly) {
        constraints.push(where('isPublished', '==', true));
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
          titleTH: d.titleTH || '',
          titleEN: d.titleEN || '',
          contentTH: d.contentTH || '',
          contentEN: d.contentEN || '',
          featuredImage: d.featuredImage || '',
          isPublished: d.isPublished ?? false,
          sortOrder: d.sortOrder || 0,
          publishedAt: d.publishedAt instanceof Timestamp ? d.publishedAt.toDate() : d.publishedAt ? new Date(d.publishedAt) : null,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt ? new Date(d.createdAt) : new Date(),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt ? new Date(d.updatedAt) : new Date(),
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as Announcement;
      });

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  /**
   * Read single Announcement
   */
  async getById(id: string): Promise<Announcement | null> {
    if (!isFirebaseConfigured) {
      const found = sandboxAnnouncements.find(a => a.id === id);
      return found ? { ...found } : null;
    }
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        titleTH: d.titleTH || '',
        titleEN: d.titleEN || '',
        contentTH: d.contentTH || '',
        contentEN: d.contentEN || '',
        featuredImage: d.featuredImage || '',
        isPublished: d.isPublished ?? false,
        sortOrder: d.sortOrder || 0,
        publishedAt: d.publishedAt instanceof Timestamp ? d.publishedAt.toDate() : d.publishedAt ? new Date(d.publishedAt) : null,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt ? new Date(d.createdAt) : new Date(),
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt ? new Date(d.updatedAt) : new Date(),
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as Announcement;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${id}`);
      return null;
    }
  },

  /**
   * Realtime subscribe to publications
   */
  subscribe(callback: (announcements: Announcement[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxAnnouncements].sort((a,b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date().getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date().getTime();
        return bTime - aTime;
      }));
      return () => {};
    }
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('sortOrder', 'asc'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          titleTH: d.titleTH || '',
          titleEN: d.titleEN || '',
          contentTH: d.contentTH || '',
          contentEN: d.contentEN || '',
          featuredImage: d.featuredImage || '',
          isPublished: d.isPublished ?? false,
          sortOrder: d.sortOrder || 0,
          publishedAt: d.publishedAt instanceof Timestamp ? d.publishedAt.toDate() : d.publishedAt ? new Date(d.publishedAt) : null,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt ? new Date(d.createdAt) : new Date(),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt ? new Date(d.updatedAt) : new Date(),
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as Announcement;
      });
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  /**
   * Create single announcement
   */
  async create(ann: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>, operatorEmail: string): Promise<Announcement> {
    const publishedAtVal = ann.isPublished ? new Date() : null;
    const fresh: Announcement = {
      ...ann,
      publishedAt: publishedAtVal,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'ann_' + Math.random().toString(36).substr(2, 9);
      const saved = { ...fresh, id: generatedId };
      sandboxAnnouncements.push(saved);
      await auditService.logAction('Create Announcement', operatorEmail, generatedId, 'Announcement', `Created: ${ann.titleTH}`);
      return saved;
    }

    try {
      const payload = {
        ...ann,
        publishedAt: ann.isPublished ? serverTimestamp() : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: operatorEmail,
        updatedBy: operatorEmail
      };
      const ref = await addDoc(collection(db, COLLECTION_NAME), payload);
      await auditService.logAction('Create Announcement', operatorEmail, ref.id, 'Announcement', `Created: ${ann.titleTH}`);
      return { ...fresh, id: ref.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
      return fresh;
    }
  },

  /**
   * Update announcement
   */
  async update(id: string, updates: Partial<Announcement>, operatorEmail: string): Promise<void> {
    // Audit actions checking
    let actionName = 'Edit Announcement';
    const detailLog: string[] = [];

    if (updates.titleTH) {
      detailLog.push(`Title: ${updates.titleTH}`);
    }

    if (updates.isPublished !== undefined) {
      actionName = updates.isPublished ? 'Publish Announcement' : 'Unpublish Announcement';
      // Set publishedAt
      updates.publishedAt = updates.isPublished ? new Date() : null;
    }

    if (!isFirebaseConfigured) {
      const idx = sandboxAnnouncements.findIndex(a => a.id === id);
      if (idx !== -1) {
        sandboxAnnouncements[idx] = {
          ...sandboxAnnouncements[idx],
          ...updates,
          updatedAt: new Date(),
          updatedBy: operatorEmail
        };
      }
      await auditService.logAction(actionName, operatorEmail, id, 'Announcement', detailLog.join(', ') || `Updated state of ${id}`);
      return;
    }

    try {
      const payload: any = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: operatorEmail
      };

      if (updates.isPublished !== undefined) {
        payload.publishedAt = updates.isPublished ? serverTimestamp() : null;
      }

      await updateDoc(doc(db, COLLECTION_NAME, id), payload);
      await auditService.logAction(actionName, operatorEmail, id, 'Announcement', detailLog.join(', ') || `Updated state of ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Delete announcement
   */
  async delete(id: string, operatorEmail: string = 'workinteg@bu.ac.th'): Promise<void> {
    if (!isFirebaseConfigured) {
      sandboxAnnouncements = sandboxAnnouncements.filter(a => a.id !== id);
      await auditService.logAction('Delete Announcement', operatorEmail, id, 'Announcement', 'Deleted successfully in sandbox mode');
      return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await auditService.logAction('Delete Announcement', operatorEmail, id, 'Announcement', 'Deleted successfully');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
