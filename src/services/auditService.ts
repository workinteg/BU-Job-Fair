/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured, auth } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { AuditLog } from '../types';
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

const COLLECTION_NAME = 'auditLogs';

let sandboxLogs: AuditLog[] = [
  {
    id: 'log_01',
    action: 'Login',
    userEmail: 'workinteg@bu.ac.th',
    targetId: 'workinteg@bu.ac.th',
    targetType: 'User',
    details: 'User logged in successfully via Google Sign In bypass.',
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'log_02',
    action: 'Add Admin',
    userEmail: 'workinteg@bu.ac.th',
    targetId: 'example@bu.ac.th',
    targetType: 'Admin',
    details: 'Staff level privileges added for example@bu.ac.th.',
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'workinteg@bu.ac.th',
    updatedBy: 'workinteg@bu.ac.th'
  }
];

export const auditService = {
  /**
   * Fetch all audit logs with standard support for pagination, limits, and order
   */
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filters?: { userEmail?: string; action?: string }
  ): Promise<{ data: AuditLog[]; lastDoc: any }> {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      let filtered = [...sandboxLogs];
      if (filters?.userEmail) {
        filtered = filtered.filter(l => l.userEmail.toLowerCase().includes(filters.userEmail!.toLowerCase()));
      }
      if (filters?.action) {
        filtered = filtered.filter(l => l.action.toLowerCase().includes(filters.action!.toLowerCase()));
      }
      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('timestamp', 'desc')];
      
      if (filters?.userEmail) {
        constraints.push(where('userEmail', '==', filters.userEmail.trim().toLowerCase()));
      }
      if (filters?.action) {
        constraints.push(where('action', '==', filters.action.trim()));
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
          action: d.action || '',
          userEmail: d.userEmail || '',
          targetId: d.targetId || '',
          targetType: d.targetType || '',
          details: d.details || '',
          timestamp: d.timestamp instanceof Timestamp ? d.timestamp.toDate() : d.timestamp,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as AuditLog;
      });

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  /**
   * Realtime stream subscription for audit logs
   */
  subscribe(callback: (logs: AuditLog[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured) {
      callback([...sandboxLogs]);
      return () => {};
    }
    const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          action: d.action || '',
          userEmail: d.userEmail || '',
          targetId: d.targetId || '',
          targetType: d.targetType || '',
          details: d.details || '',
          timestamp: d.timestamp instanceof Timestamp ? d.timestamp.toDate() : d.timestamp,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as AuditLog;
      });
      callback(logs);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  /**
   * Add a new Audit log entry
   */
  async logAction(
    action: string, 
    userEmail: string, 
    targetId: string, 
    targetType: string = 'System', 
    details: string = ''
  ): Promise<AuditLog> {
    const operator = userEmail || 'workinteg@bu.ac.th';
    const newLog: AuditLog = {
      action,
      userEmail: operator,
      targetId,
      targetType,
      details,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operator,
      updatedBy: operator
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'log_' + Math.random().toString(36).substr(2, 9);
      const savedLog = { ...newLog, id: generatedId };
      sandboxLogs.unshift(savedLog);
      return savedLog;
    }

    try {
      const ref = await addDoc(collection(db, COLLECTION_NAME), {
        action,
        userEmail: operator,
        targetId,
        targetType,
        details,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: operator,
        updatedBy: operator
      });
      return { ...newLog, id: ref.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
      return newLog;
    }
  },

  /**
   * Delete an audit log entry (for full CRUD requirement)
   */
  async deleteLog(id: string): Promise<void> {
    if (!isFirebaseConfigured) {
      sandboxLogs = sandboxLogs.filter(l => l.id !== id);
      return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Update an audit log entry (for full CRUD requirement)
   */
  async updateLog(id: string, updates: Partial<AuditLog>, operatorEmail: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const idx = sandboxLogs.findIndex(l => l.id === id);
      if (idx !== -1) {
        sandboxLogs[idx] = {
          ...sandboxLogs[idx],
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
  }
};
export default auditService;
