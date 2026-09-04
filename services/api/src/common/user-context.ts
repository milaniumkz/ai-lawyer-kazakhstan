import { ForbiddenException } from '@nestjs/common';

export function assertUserId(userId?: string | string[]) {
  const value = Array.isArray(userId) ? userId[0] : userId;
  if (!value) throw new ForbiddenException('USER_REQUIRED');
  return value;
}

export function assertSameUser(headerUserId: string | string[] | undefined, bodyUserId: string) {
  const userId = assertUserId(headerUserId);
  if (userId !== bodyUserId) throw new ForbiddenException('USER_MISMATCH');
  return userId;
}
