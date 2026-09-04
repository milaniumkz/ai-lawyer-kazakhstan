import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { ProfileRecord, SessionRecord, UserRecord } from '../identity.types';
import { IdentityRepository } from './identity.repository';

@Injectable()
export class PostgresIdentityRepository implements IdentityRepository {
  constructor(private readonly db: DatabaseService) {}

  async findUserByContact(input: { phone?: string; email?: string }) {
    const result = await this.db.query<UserRow>(
      'SELECT * FROM users WHERE ($1::text IS NOT NULL AND phone = $1) OR ($2::text IS NOT NULL AND email = $2) LIMIT 1',
      [input.phone ?? null, input.email ?? null],
    );
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }

  async createUser(input: Omit<UserRecord, 'id' | 'createdAt'>) {
    const result = await this.db.query<UserRow>(
      'INSERT INTO users (phone, email, password_hash, roles, consent_version) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [input.phone ?? null, input.email ?? null, input.passwordHash ?? null, input.roles, input.consentVersion],
    );
    return mapUser(result.rows[0]!);
  }

  async createSession(input: Pick<SessionRecord, 'userId' | 'refreshToken'>) {
    const result = await this.db.query<SessionRow>(
      'INSERT INTO sessions (user_id, refresh_token_hash) VALUES ($1, $2) RETURNING *',
      [input.userId, hashSensitiveValue(input.refreshToken)],
    );
    return mapSession(result.rows[0]!, input.refreshToken);
  }

  async revokeSession(sessionId: string) {
    await this.db.query('UPDATE sessions SET revoked_at = now() WHERE id = $1', [sessionId]);
  }

  async revokeAllSessions(userId: string) {
    await this.db.query('UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
  }

  async listSessions(userId: string) {
    const result = await this.db.query<SessionRow>('SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at.toISOString(),
      revokedAt: row.revoked_at?.toISOString(),
    }));
  }

  async createProfile(input: Omit<ProfileRecord, 'id' | 'createdAt'>) {
    const result = await this.db.query<ProfileRow>(
      'INSERT INTO profiles (user_id, type, display_name, iin_bin_hash, address, bank_account_encrypted) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        input.userId,
        input.type,
        input.displayName,
        input.iinBin ? hashSensitiveValue(input.iinBin) : null,
        input.address ?? null,
        input.bankAccount ? Buffer.from(input.bankAccount) : null,
      ],
    );
    return mapProfile(result.rows[0]!);
  }

  async listProfiles(userId: string) {
    const result = await this.db.query<ProfileRow>('SELECT * FROM profiles WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows.map(mapProfile);
  }
}

interface UserRow {
  id: string;
  phone?: string;
  email?: string;
  password_hash?: string;
  roles: string[];
  consent_version: string;
  created_at: Date;
}

interface SessionRow {
  id: string;
  user_id: string;
  created_at: Date;
  revoked_at?: Date;
}

interface ProfileRow {
  id: string;
  user_id: string;
  type: ProfileRecord['type'];
  display_name: string;
  iin_bin_hash?: string;
  address?: string;
  created_at: Date;
}

export function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    channel: row.phone ? 'phone' : 'email',
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    passwordHash: row.password_hash ?? undefined,
    roles: row.roles as UserRecord['roles'],
    consentVersion: row.consent_version,
    createdAt: row.created_at.toISOString(),
  };
}

export function mapSession(row: SessionRow, refreshToken: string): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    refreshToken,
    createdAt: row.created_at.toISOString(),
    revokedAt: row.revoked_at?.toISOString(),
  };
}

export function mapProfile(row: ProfileRow): ProfileRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    displayName: row.display_name,
    iinBin: row.iin_bin_hash ? '[hashed]' : undefined,
    address: row.address,
    createdAt: row.created_at.toISOString(),
  };
}

export function hashSensitiveValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
