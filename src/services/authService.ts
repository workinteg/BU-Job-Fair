/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth, isFirebaseConfigured } from '../firebase/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { adminService, AdminUser } from './adminService';
import { auditService } from './auditService';

export interface AuthState {
  user: FirebaseUser | null;
  role: 'superAdmin' | 'admin' | null;
  active: boolean;
  isAuthenticated: boolean;
}

export const authService = {
  /**
   * Log in via Google Sign In.
   * Enforces @bu.ac.th domain and checks admins list.
   */
  async loginWithGoogle(): Promise<{ user: FirebaseUser | any; adminRecord: AdminUser }> {
    if (!isFirebaseConfigured) {
      // Local development/sandbox bypass
      const mockUser = {
        uid: 'sandbox_uid_workinteg',
        email: 'workinteg@bu.ac.th',
        displayName: 'BU Work Integration',
        photoURL: null,
        emailVerified: true
      };
      const adminRecord = await adminService.linkFirebaseUser(mockUser.email, mockUser.uid, mockUser.displayName);
      await auditService.logAction('Login', mockUser.email, mockUser.email);
      return { user: mockUser, adminRecord };
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'bu.ac.th', // Suggests Google picker filter to bu.ac.th accounts
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email || '';

      // 1. Enforce ALLOWED DOMAIN check (@bu.ac.th)
      if (!email.toLowerCase().endsWith('@bu.ac.th')) {
        await signOut(auth);
        throw new Error('INVALID_DOMAIN');
      }

      // 2. Query / Link user in collection admins (supports first-time creation)
      let adminRecord: AdminUser;
      try {
        adminRecord = await adminService.linkFirebaseUser(email, user.uid, user.displayName || '');
      } catch (err: any) {
        await signOut(auth);
        if (err.message === 'Unauthorized account.') {
          throw new Error('UNAUTHORIZED_ACCOUNT');
        }
        throw err;
      }

      // 3. Enforce active check
      if (!adminRecord.active) {
        await signOut(auth);
        throw new Error('ACCOUNT_DISABLED');
      }

      // 4. Log Audit Log
      await auditService.logAction('Login', email, email);

      return { user, adminRecord };
    } catch (err: any) {
      console.error('Google Auth Login Failed:', err);
      throw err;
    }
  },

  /**
   * Safe Sign out of active sessions
   */
  async logout(userEmail?: string): Promise<void> {
    const emailToLog = userEmail || auth?.currentUser?.email || 'unknown@bu.ac.th';
    
    if (!isFirebaseConfigured) {
      await auditService.logAction('Logout', emailToLog, emailToLog);
      return;
    }

    try {
      await signOut(auth);
      await auditService.logAction('Logout', emailToLog, emailToLog);
    } catch (err) {
      console.error('Firebase sign out failed:', err);
      throw err;
    }
  }
};
