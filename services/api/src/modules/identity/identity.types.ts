export type AuthChannel = 'phone' | 'email';
export type Role = 'guest' | 'user' | 'legal_expert' | 'support_operator' | 'admin' | 'superadmin';
export type ProfileType = 'person' | 'individual_entrepreneur' | 'legal_entity' | 'representative';

export interface UserRecord {
  id: string;
  channel: AuthChannel;
  phone?: string;
  email?: string;
  passwordHash?: string;
  roles: Role[];
  consentVersion: string;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  refreshToken: string;
  createdAt: string;
  revokedAt?: string;
}

export interface ProfileRecord {
  id: string;
  userId: string;
  type: ProfileType;
  displayName: string;
  iinBin?: string;
  address?: string;
  bankAccount?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  actorUserId?: string;
  targetId?: string;
  metadata: Record<string, string | number | boolean | undefined>;
  correlationId: string;
  createdAt: string;
}
