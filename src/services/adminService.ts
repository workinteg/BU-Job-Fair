/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured, auth } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';
import { Admin } from '../types';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  updateDoc, 
  addDoc,
  deleteDoc,
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

export type AdminUser = Admin;

const COLLECTION_NAME = 'admins';

let sandboxAdmins: Admin[] = [
  {
    id: 'adm_01',
    uid: 'sandbox_uid_workinteg',
    email: 'workinteg@bu.ac.th',
    displayName: 'BU Work Integration',
    role: 'superAdmin',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'adm_02',
    uid: 'sandbox_uid_admin',
    email: 'example@bu.ac.th',
    displayName: 'Example Admin',
    role: 'admin',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

export const adminService = {
  /**
   * Read Admins with optional filters, ordering, pagination, and limits.
   */
  async getAll(
    limitCount?: number, 
    lastVisibleDoc?: any, 
    filters?: { role?: string; active?: boolean }
  ): Promise<{ data: Admin[]; lastDoc: any }> {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      let filtered = [...sandboxAdmins];
      if (filters?.role) {
        filtered = filtered.filter(u => u.role === filters.role);
      }
      if (filters?.active !== undefined) {
        filtered = filtered.filter(u => u.active === filters.active);
      }
      return { data: filtered, lastDoc: null };
    }

    try {
      const constraints: any[] = [orderBy('email', 'asc')];
      
      if (filters?.role) {
        constraints.push(where('role', '==', filters.role));
      }
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
          uid: d.uid || '',
          email: d.email || '',
          displayName: d.displayName || '',
          role: d.role || 'admin',
          active: d.active ?? true,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as Admin;
      });

      return { data, lastDoc };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      return { data: [], lastDoc: null };
    }
  },

  /**
   * Realtime stream subscription for administrators
   */
  subscribe(callback: (admins: Admin[]) => void, onError?: (err: any) => void) {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      callback([...sandboxAdmins]);
      return () => {};
    }
    const q = query(collection(db, COLLECTION_NAME), orderBy('email', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const admins = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          uid: d.uid || '',
          email: d.email || '',
          displayName: d.displayName || '',
          role: d.role || 'admin',
          active: d.active ?? true,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
          createdBy: d.createdBy || 'system',
          updatedBy: d.updatedBy || 'system'
        } as Admin;
      });
      callback(admins);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      if (onError) onError(err);
    });
  },

  /**
   * Fetch admin by email
   */
  async getAdminByEmail(email: string): Promise<Admin | null> {
    if (!isFirebaseConfigured) {
      const found = sandboxAdmins.find(adm => adm.email.toLowerCase() === email.toLowerCase());
      return found ? { ...found } : null;
    }
    try {
      const q = query(collection(db, COLLECTION_NAME), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docSnap = snap.docs[0];
      const d = docSnap.data();
      return {
        id: docSnap.id,
        uid: d.uid || '',
        email: d.email || '',
        displayName: d.displayName || '',
        role: d.role || 'admin',
        active: d.active ?? true,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as Admin;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  async getById(id: string): Promise<Admin | null> {
    if (!isFirebaseConfigured) {
      const found = sandboxAdmins.find(adm => adm.id === id);
      return found ? { ...found } : null;
    }
    try {
      const ref = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(ref);
      if (!docSnap.exists()) return null;
      const d = docSnap.data();
      return {
        id: docSnap.id,
        uid: d.uid || '',
        email: d.email || '',
        displayName: d.displayName || '',
        role: d.role || 'admin',
        active: d.active ?? true,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : d.createdAt,
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : d.updatedAt,
        createdBy: d.createdBy || 'system',
        updatedBy: d.updatedBy || 'system'
      } as Admin;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${id}`);
      return null;
    }
  },

  /**
   * Add a new Administrator coordinate config
   */
  async addAdmin(email: string, role: 'superAdmin' | 'admin', active: boolean, operatorEmail: string): Promise<Admin> {
    const trimmedEmail = email.trim().toLowerCase();
    const existing = await this.getAdminByEmail(trimmedEmail);
    if (existing) {
      throw new Error(`Email ${email} is already signed up inside system roles.`);
    }

    const newAdmin: Admin = {
      uid: '',
      email: trimmedEmail,
      displayName: '',
      role,
      active,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorEmail,
      updatedBy: operatorEmail
    };

    if (!isFirebaseConfigured) {
      const generatedId = 'adm_' + Math.random().toString(36).substr(2, 9);
      const savedAdmin = { ...newAdmin, id: generatedId };
      sandboxAdmins.push(savedAdmin);
      await auditService.logAction('Add Admin', operatorEmail, trimmedEmail);
      return savedAdmin;
    }

    try {
      const ref = await addDoc(collection(db, COLLECTION_NAME), {
        uid: '',
        email: trimmedEmail,
        displayName: '',
        role,
        active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: operatorEmail,
        updatedBy: operatorEmail
      });
      await auditService.logAction('Add Admin', operatorEmail, trimmedEmail);
      return { ...newAdmin, id: ref.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
      return newAdmin;
    }
  },

  /**
   * Changes System role
   */
  async updateAdminRole(id: string, email: string, role: 'superAdmin' | 'admin', operatorEmail: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const idx = sandboxAdmins.findIndex(x => x.id === id || x.email === email);
      if (idx !== -1) {
        sandboxAdmins[idx].role = role;
        sandboxAdmins[idx].updatedBy = operatorEmail;
        sandboxAdmins[idx].updatedAt = new Date();
      }
      await auditService.logAction('Change Role', operatorEmail, email);
      return;
    }

    try {
      const ref = doc(db, COLLECTION_NAME, id);
      await updateDoc(ref, {
        role,
        updatedBy: operatorEmail,
        updatedAt: serverTimestamp()
      });
      await auditService.logAction('Change Role', operatorEmail, email);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Toggle Admin Status
   */
  async updateAdminStatus(id: string, email: string, active: boolean, operatorEmail: string): Promise<void> {
    const actionName = active ? 'Enable User' : 'Disable User';
    if (!isFirebaseConfigured) {
      const idx = sandboxAdmins.findIndex(x => x.id === id || x.email === email);
      if (idx !== -1) {
        sandboxAdmins[idx].active = active;
        sandboxAdmins[idx].updatedBy = operatorEmail;
        sandboxAdmins[idx].updatedAt = new Date();
      }
      await auditService.logAction(actionName, operatorEmail, email);
      return;
    }

    try {
      const ref = doc(db, COLLECTION_NAME, id);
      await updateDoc(ref, {
        active,
        updatedBy: operatorEmail,
        updatedAt: serverTimestamp()
      });
      await auditService.logAction(actionName, operatorEmail, email);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Delete Admin User Profile (Delete operation required)
   */
  async deleteAdmin(id: string, operatorEmail: string): Promise<void> {
    const existing = await this.getById(id);
    const targetEmail = existing ? existing.email : 'unknown';

    if (!isFirebaseConfigured) {
      sandboxAdmins = sandboxAdmins.filter(x => x.id !== id);
      await auditService.logAction('Delete Admin', operatorEmail, targetEmail);
      return;
    }

    try {
      const ref = doc(db, COLLECTION_NAME, id);
      await deleteDoc(ref);
      await auditService.logAction('Delete Admin', operatorEmail, targetEmail);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  },

  /**
   * Associate Firebase User when they log in for the first time
   */
  async linkFirebaseUser(email: string, uid: string, displayName: string): Promise<Admin> {
    const trimmedEmail = email.trim().toLowerCase();
    const existing = await this.getAdminByEmail(trimmedEmail);

    if (existing) {
      if (!isFirebaseConfigured) {
        const index = sandboxAdmins.findIndex(adm => adm.email === trimmedEmail);
        if (index !== -1) {
          sandboxAdmins[index].uid = uid;
          sandboxAdmins[index].displayName = displayName;
          sandboxAdmins[index].updatedAt = new Date();
          return sandboxAdmins[index];
        }
        return existing;
      }

      try {
        // Enforce document ID to be the user's secret/safe firebase uid
        const docRef = doc(db, COLLECTION_NAME, uid);
        await setDoc(docRef, {
          uid,
          email: trimmedEmail,
          displayName,
          role: existing.role,
          active: existing.active,
          createdAt: existing.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: existing.createdBy || 'system',
          updatedBy: existing.updatedBy || 'system'
        });

        // If the pre-registered document ID was different from uid, delete the old one
        if (existing.id && existing.id !== uid) {
          try {
            const oldDocRef = doc(db, COLLECTION_NAME, existing.id);
            await deleteDoc(oldDocRef);
          } catch (deleteErr) {
            console.warn('Failed to delete legacy admin record during linking:', deleteErr);
          }
        }

        return {
          id: uid,
          uid,
          email: trimmedEmail,
          displayName,
          role: existing.role,
          active: existing.active,
          createdAt: existing.createdAt,
          updatedAt: new Date(),
          createdBy: existing.createdBy,
          updatedBy: existing.updatedBy
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${uid}`);
        return existing;
      }
    } else {
      if (trimmedEmail === 'workinteg@bu.ac.th') {
        const firstSuperAdmin: Admin = {
          uid,
          email: trimmedEmail,
          displayName,
          role: 'superAdmin',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system'
        };

        if (!isFirebaseConfigured) {
          const saved = { ...firstSuperAdmin, id: 'adm_workinteg' };
          sandboxAdmins.push(saved);
          return saved;
        }

        try {
          const docRef = doc(db, COLLECTION_NAME, uid);
          await setDoc(docRef, {
            uid,
            email: trimmedEmail,
            displayName,
            role: 'superAdmin',
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: 'system',
            updatedBy: 'system'
          });
          return { ...firstSuperAdmin, id: uid };
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
          return firstSuperAdmin;
        }
      } else {
        throw new Error('Unauthorized account.');
      }
    }
  }
};
