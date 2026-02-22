import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

type RequestUser = {
  role?: string;
  permissions?: string[];
};

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'orders.view',
    'orders.edit',
    'products.edit',
    'products.categories.view',
    'products.categories.edit',
    'messages.view',
    'messages.edit',
    'settings.view',
    'settings.edit',
    'settings.general.view',
    'settings.general.edit',
    'settings.store.view',
    'settings.store.edit',
    'settings.notifications.view',
    'settings.notifications.edit',
    'settings.promo.view',
    'settings.promo.edit',
    'settings.weekly.view',
    'settings.weekly.edit',
    'settings.featured.view',
    'settings.featured.edit',
    'settings.payment.view',
    'settings.payment.edit',
    'settings.shipping.view',
    'settings.shipping.edit',
    'settings.notice.view',
  ],
  MANAGER: [],
};

function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (userPermissions.includes(requiredPermission)) return true;
  if (requiredPermission.startsWith('products.categories.') && userPermissions.includes('products.edit')) {
    return true;
  }
  if (requiredPermission.startsWith('settings.')) {
    if (requiredPermission.endsWith('.view') && userPermissions.includes('settings.view')) return true;
    if (requiredPermission.endsWith('.edit') && userPermissions.includes('settings.edit')) return true;
  }
  return false;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    if (!user) return false;

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const userPermissionsRaw = Array.isArray(user.permissions) ? user.permissions : [];
    const userPermissions =
      userPermissionsRaw.length > 0
        ? userPermissionsRaw
        : ROLE_DEFAULT_PERMISSIONS[user.role || ''] || [];
    return requiredPermissions.every((permission) => hasPermission(userPermissions, permission));
  }
}
