import { Permission, Role, RolePermissions, User } from '@/types/auth';

export class RBACManager {
  private static readonly roleHierarchy: Record<Role, Role[]> = {
    admin: ['admin', 'manager', 'user', 'viewer'],
    manager: ['manager', 'user', 'viewer'],
    user: ['user', 'viewer'],
    viewer: ['viewer'],
  };

  private static readonly defaultPermissions: RolePermissions = {
    admin: [
      { id: '1', resource: 'system', action: 'admin', granted: true },
      { id: '2', resource: 'users', action: 'manage', granted: true },
      { id: '3', resource: 'projects', action: 'manage', granted: true },
      { id: '4', resource: 'clients', action: 'manage', granted: true },
      { id: '5', resource: 'analytics', action: 'view', granted: true },
      { id: '6', resource: 'settings', action: 'manage', granted: true },
      { id: '7', resource: 'dashboard', action: 'view', granted: true },
    ],
    manager: [
      { id: '8', resource: 'projects', action: 'manage', granted: true },
      { id: '9', resource: 'clients', action: 'manage', granted: true },
      { id: '10', resource: 'users', action: 'view', granted: true },
      { id: '11', resource: 'analytics', action: 'view', granted: true },
      { id: '12', resource: 'settings', action: 'view', granted: true },
      { id: '13', resource: 'dashboard', action: 'view', granted: true },
    ],
    user: [
      { id: '14', resource: 'projects', action: 'view', granted: true },
      { id: '15', resource: 'projects', action: 'edit', granted: true },
      { id: '16', resource: 'clients', action: 'view', granted: true },
      { id: '17', resource: 'analytics', action: 'view', granted: true },
      { id: '18', resource: 'profile', action: 'manage', granted: true },
      { id: '19', resource: 'dashboard', action: 'view', granted: true },
    ],
    viewer: [
      { id: '20', resource: 'projects', action: 'view', granted: true },
      { id: '21', resource: 'clients', action: 'view', granted: true },
      { id: '22', resource: 'analytics', action: 'view', granted: true },
      { id: '23', resource: 'profile', action: 'view', granted: true },
      { id: '24', resource: 'dashboard', action: 'view', granted: true },
    ],
  };

  static hasPermission(
    user: User,
    resource: string,
    action: string
  ): boolean {
    if (!user || !user.permissions) return false;

    // Check direct permissions first
    const directPermission = user.permissions.find(
      (permission) =>
        permission.resource === resource &&
        permission.action === action
    );

    // If there's a direct permission, respect it (whether granted or denied)
    if (directPermission) {
      return directPermission.granted;
    }

    // If no direct permission, check role-based permissions
    const userRole = this.getUserRole(user);
    const rolePermissions = this.defaultPermissions[userRole] || [];

    return rolePermissions.some(
      (permission) =>
        permission.resource === resource &&
        permission.action === action &&
        permission.granted
    );
  }

  static hasAnyPermission(
    user: User,
    permissions: Array<{ resource: string; action: string }>
  ): boolean {
    return permissions.some(({ resource, action }) =>
      this.hasPermission(user, resource, action)
    );
  }

  static hasAllPermissions(
    user: User,
    permissions: Array<{ resource: string; action: string }>
  ): boolean {
    return permissions.every(({ resource, action }) =>
      this.hasPermission(user, resource, action)
    );
  }

  static getUserRole(user: User): Role {
    if (!user || !user.permissions) return 'viewer';

    // Check for admin permissions
    if (
      user.permissions.some(
        (p) => p.resource === 'system' && p.action === 'admin' && p.granted
      )
    ) {
      return 'admin';
    }

    // Check for manager permissions
    if (
      user.permissions.some(
        (p) => p.resource === 'projects' && p.action === 'manage' && p.granted
      ) ||
      user.permissions.some(
        (p) => p.resource === 'users' && p.action === 'manage' && p.granted
      )
    ) {
      return 'manager';
    }

    // Check for user permissions
    if (
      user.permissions.some(
        (p) => p.resource === 'projects' && p.action === 'edit' && p.granted
      )
    ) {
      return 'user';
    }

    return 'viewer';
  }

  static canAccessRoute(user: User, route: string): boolean {
    const routePermissions: Record<string, { resource: string; action: string }> = {
      '/dashboard': { resource: 'dashboard', action: 'view' },
      '/projects': { resource: 'projects', action: 'view' },
      '/projects/create': { resource: 'projects', action: 'create' },
      '/projects/manage': { resource: 'projects', action: 'manage' },
      '/clients': { resource: 'clients', action: 'view' },
      '/clients/manage': { resource: 'clients', action: 'manage' },
      '/analytics': { resource: 'analytics', action: 'view' },
      '/settings': { resource: 'settings', action: 'view' },
      '/admin': { resource: 'system', action: 'admin' },
      '/users': { resource: 'users', action: 'view' },
      '/users/manage': { resource: 'users', action: 'manage' },
    };

    const requiredPermission = routePermissions[route];
    if (!requiredPermission) return true; // Allow access to unprotected routes

    return this.hasPermission(
      user,
      requiredPermission.resource,
      requiredPermission.action
    );
  }

  static getPermissionsForRole(role: Role): Permission[] {
    return this.defaultPermissions[role] || [];
  }

  static canAssumeRole(currentRole: Role, targetRole: Role): boolean {
    const allowedRoles = this.roleHierarchy[currentRole] || [];
    return allowedRoles.includes(targetRole);
  }

  static getAccessibleRoutes(user: User): string[] {
    const allRoutes = [
      '/dashboard',
      '/projects',
      '/projects/create',
      '/projects/manage',
      '/clients',
      '/clients/manage',
      '/analytics',
      '/settings',
      '/admin',
      '/users',
      '/users/manage',
    ];

    return allRoutes.filter((route) => this.canAccessRoute(user, route));
  }
}