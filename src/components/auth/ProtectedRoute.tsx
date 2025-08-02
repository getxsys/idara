'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RBACManager } from '@/lib/auth/rbac';

interface ProtectedRouteProps {
  children: ReactNode;
  resource?: string;
  action?: string;
  permissions?: Array<{ resource: string; action: string }>;
  requireAll?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  resource,
  action,
  permissions,
  requireAll = false,
  fallback,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    if (redirectTo) {
      // In a real app, you'd use Next.js router to redirect
      window.location.href = redirectTo;
      return null;
    }

    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">You need to be logged in to access this page.</p>
          </div>
        </div>
      )
    );
  }

  // Check specific resource/action permission
  if (resource && action) {
    const hasPermission = RBACManager.hasPermission(user, resource, action);
    if (!hasPermission) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to access this resource.
              </p>
            </div>
          </div>
        )
      );
    }
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasPermissions = requireAll
      ? RBACManager.hasAllPermissions(user, permissions)
      : RBACManager.hasAnyPermission(user, permissions);

    if (!hasPermissions) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600">
                You don't have the required permissions to access this resource.
              </p>
            </div>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for checking permissions in components
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    return RBACManager.hasPermission(user, resource, action);
  };

  const hasAnyPermission = (permissions: Array<{ resource: string; action: string }>): boolean => {
    if (!user) return false;
    return RBACManager.hasAnyPermission(user, permissions);
  };

  const hasAllPermissions = (permissions: Array<{ resource: string; action: string }>): boolean => {
    if (!user) return false;
    return RBACManager.hasAllPermissions(user, permissions);
  };

  const canAccessRoute = (route: string): boolean => {
    if (!user) return false;
    return RBACManager.canAccessRoute(user, route);
  };

  const getUserRole = () => {
    if (!user) return 'viewer';
    return RBACManager.getUserRole(user);
  };

  const getAccessibleRoutes = (): string[] => {
    if (!user) return [];
    return RBACManager.getAccessibleRoutes(user);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    getUserRole,
    getAccessibleRoutes,
  };
}