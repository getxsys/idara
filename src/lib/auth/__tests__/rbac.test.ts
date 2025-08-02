import { RBACManager } from '../rbac';
import { User, Permission } from '@/types/auth';

describe('RBACManager', () => {
  const createMockUser = (permissions: Permission[]): User => ({
    id: '1',
    email: 'test@example.com',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      timezone: 'UTC',
      language: 'en',
    },
    preferences: {
      dashboard: { layout: 'grid', widgets: [], refreshInterval: 30 },
      notifications: { email: true, push: false, inApp: true, frequency: 'daily' },
      aiAssistance: { enabled: true, suggestionLevel: 'moderate', autoComplete: false },
      theme: { mode: 'system', primaryColor: '#3b82f6', fontSize: 'medium' },
    },
    permissions,
    aiContext: { workContext: [], preferences: {}, learningData: {} },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('hasPermission', () => {
    it('should return true for user with direct permission', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: true },
      ]);

      const result = RBACManager.hasPermission(user, 'projects', 'view');
      expect(result).toBe(true);
    });

    it('should return false for user without permission', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: true },
      ]);

      const result = RBACManager.hasPermission(user, 'projects', 'manage');
      expect(result).toBe(false);
    });

    it('should return false for user with denied permission', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: false },
      ]);

      const result = RBACManager.hasPermission(user, 'projects', 'view');
      expect(result).toBe(false);
    });

    it('should return false for null user', () => {
      const result = RBACManager.hasPermission(null as any, 'projects', 'view');
      expect(result).toBe(false);
    });

    it('should return true for admin user based on role permissions', () => {
      const user = createMockUser([
        { id: '1', resource: 'system', action: 'admin', granted: true },
      ]);

      const result = RBACManager.hasPermission(user, 'users', 'manage');
      expect(result).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the required permissions', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: true },
      ]);

      const permissions = [
        { resource: 'projects', action: 'view' },
        { resource: 'projects', action: 'manage' },
      ];

      const result = RBACManager.hasAnyPermission(user, permissions);
      expect(result).toBe(true);
    });

    it('should return false if user has none of the required permissions', () => {
      const user = createMockUser([
        { id: '1', resource: 'clients', action: 'view', granted: true },
      ]);

      const permissions = [
        { resource: 'system', action: 'admin' },
        { resource: 'users', action: 'manage' },
      ];

      const result = RBACManager.hasAnyPermission(user, permissions);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all required permissions', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: true },
        { id: '2', resource: 'projects', action: 'edit', granted: true },
      ]);

      const permissions = [
        { resource: 'projects', action: 'view' },
        { resource: 'projects', action: 'edit' },
      ];

      const result = RBACManager.hasAllPermissions(user, permissions);
      expect(result).toBe(true);
    });

    it('should return false if user is missing any required permission', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: true },
      ]);

      const permissions = [
        { resource: 'projects', action: 'view' },
        { resource: 'projects', action: 'edit' },
      ];

      const result = RBACManager.hasAllPermissions(user, permissions);
      expect(result).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return admin for user with system admin permission', () => {
      const user = createMockUser([
        { id: '1', resource: 'system', action: 'admin', granted: true },
      ]);

      const role = RBACManager.getUserRole(user);
      expect(role).toBe('admin');
    });

    it('should return manager for user with project management permission', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'manage', granted: true },
      ]);

      const role = RBACManager.getUserRole(user);
      expect(role).toBe('manager');
    });

    it('should return user for user with project edit permission', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'edit', granted: true },
      ]);

      const role = RBACManager.getUserRole(user);
      expect(role).toBe('user');
    });

    it('should return viewer for user with only view permissions', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: true },
      ]);

      const role = RBACManager.getUserRole(user);
      expect(role).toBe('viewer');
    });

    it('should return viewer for user with no permissions', () => {
      const user = createMockUser([]);

      const role = RBACManager.getUserRole(user);
      expect(role).toBe('viewer');
    });

    it('should return viewer for null user', () => {
      const role = RBACManager.getUserRole(null as any);
      expect(role).toBe('viewer');
    });
  });

  describe('canAccessRoute', () => {
    it('should allow access to dashboard for user with view permissions', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: true },
      ]);

      const canAccess = RBACManager.canAccessRoute(user, '/dashboard');
      expect(canAccess).toBe(true);
    });

    it('should deny access to admin route for non-admin user', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: true },
      ]);

      const canAccess = RBACManager.canAccessRoute(user, '/admin');
      expect(canAccess).toBe(false);
    });

    it('should allow access to admin route for admin user', () => {
      const user = createMockUser([
        { id: '1', resource: 'system', action: 'admin', granted: true },
      ]);

      const canAccess = RBACManager.canAccessRoute(user, '/admin');
      expect(canAccess).toBe(true);
    });

    it('should allow access to unprotected routes', () => {
      const user = createMockUser([]);

      const canAccess = RBACManager.canAccessRoute(user, '/unprotected');
      expect(canAccess).toBe(true);
    });

    it('should deny access for null user to protected routes', () => {
      const canAccess = RBACManager.canAccessRoute(null as any, '/admin');
      expect(canAccess).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return admin permissions for admin role', () => {
      const permissions = RBACManager.getPermissionsForRole('admin');
      
      expect(permissions).toContainEqual(
        expect.objectContaining({ resource: 'system', action: 'admin', granted: true })
      );
      expect(permissions).toContainEqual(
        expect.objectContaining({ resource: 'users', action: 'manage', granted: true })
      );
    });

    it('should return manager permissions for manager role', () => {
      const permissions = RBACManager.getPermissionsForRole('manager');
      
      expect(permissions).toContainEqual(
        expect.objectContaining({ resource: 'projects', action: 'manage', granted: true })
      );
      expect(permissions).not.toContainEqual(
        expect.objectContaining({ resource: 'system', action: 'admin' })
      );
    });

    it('should return empty array for invalid role', () => {
      const permissions = RBACManager.getPermissionsForRole('invalid' as any);
      expect(permissions).toEqual([]);
    });
  });

  describe('canAssumeRole', () => {
    it('should allow admin to assume any role', () => {
      expect(RBACManager.canAssumeRole('admin', 'manager')).toBe(true);
      expect(RBACManager.canAssumeRole('admin', 'user')).toBe(true);
      expect(RBACManager.canAssumeRole('admin', 'viewer')).toBe(true);
    });

    it('should allow manager to assume user and viewer roles', () => {
      expect(RBACManager.canAssumeRole('manager', 'user')).toBe(true);
      expect(RBACManager.canAssumeRole('manager', 'viewer')).toBe(true);
      expect(RBACManager.canAssumeRole('manager', 'admin')).toBe(false);
    });

    it('should not allow lower roles to assume higher roles', () => {
      expect(RBACManager.canAssumeRole('user', 'admin')).toBe(false);
      expect(RBACManager.canAssumeRole('user', 'manager')).toBe(false);
      expect(RBACManager.canAssumeRole('viewer', 'user')).toBe(false);
    });
  });

  describe('getAccessibleRoutes', () => {
    it('should return all routes for admin user', () => {
      const user = createMockUser([
        { id: '1', resource: 'system', action: 'admin', granted: true },
      ]);

      const routes = RBACManager.getAccessibleRoutes(user);
      expect(routes).toContain('/admin');
      expect(routes).toContain('/users/manage');
      expect(routes).toContain('/projects/manage');
    });

    it('should return limited routes for viewer user', () => {
      const user = createMockUser([
        { id: '1', resource: 'projects', action: 'view', granted: true },
      ]);

      const routes = RBACManager.getAccessibleRoutes(user);
      expect(routes).toContain('/dashboard');
      expect(routes).toContain('/projects');
      expect(routes).not.toContain('/admin');
      expect(routes).not.toContain('/users/manage');
    });

    it('should return empty array for null user', () => {
      const routes = RBACManager.getAccessibleRoutes(null as any);
      expect(routes).toEqual([]);
    });
  });
});