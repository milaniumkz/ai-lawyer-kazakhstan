import { ForbiddenException } from '@nestjs/common';

const ADMIN_ROLES = new Set(['admin', 'superadmin']);

export function assertAdminRole(roleHeader: string | string[] | undefined) {
  const role = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;
  if (!role || !ADMIN_ROLES.has(role)) throw new ForbiddenException('ADMIN_ROLE_REQUIRED');
}
