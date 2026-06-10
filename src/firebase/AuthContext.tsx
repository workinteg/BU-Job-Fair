/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/authService';
import { adminService, AdminUser } from '../services/adminService';

interface AuthContextType {
  user: FirebaseUser | any | null;
  role: 'superAdmin' | 'admin' | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasPermission: (required: 'superAdmin' | 'admin' | string) => boolean;
  login: () => Promise<void>;
  loginMock: (email?: string, mockRole?: 'superAdmin' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<'superAdmin' | 'admin' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const savedUser = localStorage.getItem('bu_sandbox_user');
      const savedRole = localStorage.getItem('bu_sandbox_role');
      if (savedUser && savedRole) {
        setUser(JSON.parse(savedUser));
        setRole(savedRole as 'superAdmin' | 'admin');
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const email = firebaseUser.email || '';
          if (email.toLowerCase().endsWith('@bu.ac.th')) {
            const adminRecord = await adminService.getAdminByEmail(email);
            if (adminRecord && adminRecord.active) {
              setUser(firebaseUser);
              setRole(adminRecord.role);
            } else {
              // Not active or not setup yet, sign out immediately
              setUser(null);
              setRole(null);
              await auth.signOut();
            }
          } else {
            setUser(null);
            setRole(null);
            await auth.signOut();
          }
        } catch (err) {
          console.error('Error fetching admin record during auth state change:', err);
          setUser(null);
          setRole(null);
        }
      } else {
        // Fallback to bypassed local storage mock session if exists, otherwise sign out
        const savedUser = localStorage.getItem('bu_sandbox_user');
        const savedRole = localStorage.getItem('bu_sandbox_role');
        if (savedUser && savedRole) {
          const parsed = JSON.parse(savedUser);
          if (parsed.uid?.startsWith('sandbox_uid_')) {
            setUser(parsed);
            setRole(savedRole as 'superAdmin' | 'admin');
          } else {
            setUser(null);
            setRole(null);
          }
        } else {
          setUser(null);
          setRole(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const { user: loggedInUser, adminRecord } = await authService.loginWithGoogle();
      setUser(loggedInUser);
      setRole(adminRecord.role);
      
      // Store in localStorage for persistence in sandbox/preview contexts
      localStorage.setItem('bu_sandbox_user', JSON.stringify(loggedInUser));
      localStorage.setItem('bu_sandbox_role', adminRecord.role);
    } catch (err) {
      setUser(null);
      setRole(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginMock = async (email: string = 'workinteg@bu.ac.th', mockRole: 'superAdmin' | 'admin' = 'superAdmin') => {
    setLoading(true);
    try {
      const mockUser = {
        uid: 'sandbox_uid_' + email.split('@')[0],
        email: email,
        displayName: mockRole === 'superAdmin' ? 'BU Work Integration (Super)' : 'BU Staff Admin',
        photoURL: null,
        emailVerified: true
      };
      
      setUser(mockUser);
      setRole(mockRole);
      
      localStorage.setItem('bu_sandbox_user', JSON.stringify(mockUser));
      localStorage.setItem('bu_sandbox_role', mockRole);
    } catch (err) {
      console.error('Mock login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    const email = user?.email || '';
    try {
      await authService.logout(email);
    } catch (err) {
      console.error('Context logout error:', err);
    } finally {
      setUser(null);
      setRole(null);
      localStorage.removeItem('bu_sandbox_user');
      localStorage.removeItem('bu_sandbox_role');
      setLoading(false);
    }
  };

  const isAuthenticated = user !== null && role !== null;

  const hasPermission = (check: 'superAdmin' | 'admin' | string): boolean => {
    if (!isAuthenticated || !role) return false;
    
    // Superadmin has absolute permission for everything
    if (role === 'superAdmin') return true;

    // Check by role explicitly
    if (check === 'superAdmin') return role === 'superAdmin';
    if (check === 'admin') return role === 'admin' || role === 'superAdmin';

    // Check by routing path/features
    // Admin permissions restricted pages:
    const lowercaseCheck = check.toLowerCase();
    if (
      lowercaseCheck.includes('setting') || 
      lowercaseCheck.includes('audit-log') || 
      lowercaseCheck.includes('admin')
    ) {
      return false; // Standard admin cannot accessSettings, Audit Logs, and Admin management
    }

    return true; // Simple pages are accessible to both
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, isAuthenticated, hasPermission, login, loginMock, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
