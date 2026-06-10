/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { AppLoading } from '../components/AppLoading';

interface RouterContextType {
  currentPath: string;
  navigate: (to: string) => void;
  isActive: (path: string, exact?: boolean) => boolean;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (to: string) => {
    window.history.pushState(null, '', to);
    setCurrentPath(to);
    // Scroll to top on navigation for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return currentPath === path;
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate, isActive }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

interface RouteProps {
  path: string;
  element: React.ReactElement;
  exact?: boolean;
}

export const Route: React.FC<RouteProps> = ({ path, element, exact = false }) => {
  const { currentPath } = useRouter();
  
  const matches = exact ? currentPath === path : currentPath === path || currentPath.startsWith(path + '/');
  
  if (matches) {
    return element;
  }
  return null;
};

/**
 * Ensures user is authenticated before viewing element.
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <AppLoading text="Checking credentials..." />;
  }

  return isAuthenticated ? <>{children}</> : null;
};

/**
 * Access restricted to superAdmin or admin role
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/admin/login');
      } else if (role !== 'superAdmin' && role !== 'admin') {
        navigate('/admin/unauthorized');
      }
    }
  }, [isAuthenticated, role, loading, navigate]);

  if (loading) {
    return <AppLoading text="Authorizing..." />;
  }

  return isAuthenticated && (role === 'superAdmin' || role === 'admin') ? <>{children}</> : null;
};

/**
 * Access restricted by specific permissions or current path check.
 */
export const RoleRoute: React.FC<{ children: React.ReactNode; permission: string }> = ({ children, permission }) => {
  const { isAuthenticated, hasPermission, loading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/admin/login');
      } else if (!hasPermission(permission)) {
        navigate('/admin/unauthorized');
      }
    }
  }, [isAuthenticated, loading, hasPermission, permission, navigate]);

  if (loading) {
    return <AppLoading text="Verifying permissions..." />;
  }

  return isAuthenticated && hasPermission(permission) ? <>{children}</> : null;
};

