/**
 * RBAC Middleware
 * Role-Based Access Control for CyberForge
 */

import { Request, Response, NextFunction } from 'express';

export enum Permission {
  // Project permissions
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  
  // Scan permissions
  SCAN_CREATE = 'scan:create',
  SCAN_READ = 'scan:read',
  SCAN_UPDATE = 'scan:update',
  SCAN_DELETE = 'scan:delete',
  SCAN_CANCEL = 'scan:cancel',
  
  // Vulnerability permissions
  VULN_READ = 'vulnerability:read',
  VULN_UPDATE = 'vulnerability:update',
  VULN_TRIAGE = 'vulnerability:triage',
  VULN_RESOLVE = 'vulnerability:resolve',
  VULN_ASSIGN = 'vulnerability:assign',
  
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',
  
  // System permissions
  SYSTEM_SETTINGS = 'system:settings',
  AUDIT_LOG_READ = 'audit:read',
  ANALYTICS_READ = 'analytics:read',
  API_KEY_MANAGE = 'apikey:manage',
}

export enum Role {
  ADMIN = 'ADMIN',
  SECURITY = 'SECURITY',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
}

// Role-to-Permissions mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // Admins have all permissions
    ...Object.values(Permission),
  ],
  
  [Role.SECURITY]: [
    // Security analysts can manage vulnerabilities and scans
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.SCAN_CREATE,
    Permission.SCAN_READ,
    Permission.SCAN_UPDATE,
    Permission.SCAN_CANCEL,
    Permission.VULN_READ,
    Permission.VULN_UPDATE,
    Permission.VULN_TRIAGE,
    Permission.VULN_RESOLVE,
    Permission.VULN_ASSIGN,
    Permission.USER_READ,
    Permission.AUDIT_LOG_READ,
    Permission.ANALYTICS_READ,
  ],
  
  [Role.DEVELOPER]: [
    // Developers can create projects and scans, view/update vulnerabilities
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.SCAN_CREATE,
    Permission.SCAN_READ,
    Permission.SCAN_CANCEL,
    Permission.VULN_READ,
    Permission.VULN_UPDATE,
    Permission.VULN_RESOLVE,
    Permission.USER_READ,
  ],
  
  [Role.VIEWER]: [
    // Viewers have read-only access
    Permission.PROJECT_READ,
    Permission.SCAN_READ,
    Permission.VULN_READ,
    Permission.ANALYTICS_READ,
  ],
};

/**
 * Check if user has required permission
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Middleware: Require specific permission
 */
export function requirePermission(permission: Permission) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role as Role;
    
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `This action requires ${permission} permission`,
        requiredPermission: permission,
        yourRole: userRole
      });
    }

    next();
  };
}

/**
 * Middleware: Require any of the specified permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role as Role;
    
    if (!hasAnyPermission(userRole, permissions)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `This action requires one of: ${permissions.join(', ')}`,
        yourRole: userRole
      });
    }

    next();
  };
}

/**
 * Middleware: Require all specified permissions
 */
export function requireAllPermissions(...permissions: Permission[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role as Role;
    
    if (!hasAllPermissions(userRole, permissions)) {
      const missingPermissions = permissions.filter(p => !hasPermission(userRole, p));
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `This action requires all of: ${permissions.join(', ')}`,
        missingPermissions,
        yourRole: userRole
      });
    }

    next();
  };
}

/**
 * Middleware: Require specific role
 */
export function requireRole(...roles: Role[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role as Role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${roles.join(', ')}`,
        yourRole: userRole
      });
    }

    next();
  };
}

/**
 * Middleware: Admin only
 */
export function requireAdmin() {
  return requireRole(Role.ADMIN);
}

/**
 * Middleware: Resource ownership check
 * Ensures user owns the resource or has admin/security role
 */
export function requireOwnership(resourceUserIdGetter: (req: any) => string) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role as Role;
    const userId = req.user.userId;
    
    // Admins and Security can access any resource
    if (userRole === Role.ADMIN || userRole === Role.SECURITY) {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = resourceUserIdGetter(req);
    
    if (userId !== resourceUserId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if action is allowed for user role
 */
export function isActionAllowed(
  userRole: Role,
  action: string,
  resourceType: string
): boolean {
  const permission = `${resourceType}:${action}` as Permission;
  return hasPermission(userRole, permission);
}

export default {
  Permission,
  Role,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAdmin,
  requireOwnership,
  getPermissionsForRole,
  isActionAllowed,
};
