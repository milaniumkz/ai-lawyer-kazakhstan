import { AuditEvent, ProfileRecord, SessionRecord, UserRecord } from '../identity.types';

export interface IdentityRepository {
  findUserByContact(input: { phone?: string; email?: string }): Promise<UserRecord | undefined>;
  findUserById(userId: string): Promise<UserRecord | undefined>;
  createUser(input: Omit<UserRecord, 'id' | 'createdAt'>): Promise<UserRecord>;
  createSession(input: Pick<SessionRecord, 'userId' | 'refreshToken'>): Promise<SessionRecord>;
  findSessionByRefreshToken(refreshToken: string): Promise<SessionRecord | undefined>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllSessions(userId: string): Promise<void>;
  listSessions(userId: string): Promise<Array<Omit<SessionRecord, 'refreshToken'>>>;
  createProfile(input: Omit<ProfileRecord, 'id' | 'createdAt'>): Promise<ProfileRecord>;
  listProfiles(userId: string): Promise<ProfileRecord[]>;
  exportOwnedData?(userId: string): Promise<Record<string, unknown>>;
  deleteAccount(userId: string): Promise<void>;
  createAuditEvent(input: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent>;
  listAuditEvents(): Promise<AuditEvent[]>;
}
