import { DatabaseService } from '../../../common/database/database.service';
import { PostgresIdentityRepository, hashSensitiveValue, mapProfile, mapUser } from './postgres-identity.repository';

describe('PostgresIdentityRepository mapping', () => {
  it('maps user rows without exposing storage column names', () => {
    const user = mapUser({
      id: 'user-1',
      phone: '+77011234567',
      roles: ['user'],
      consent_version: 'v1',
      created_at: new Date('2026-09-04T00:00:00.000Z'),
    });

    expect(user.channel).toBe('phone');
    expect(user.consentVersion).toBe('v1');
    expect(user.createdAt).toBe('2026-09-04T00:00:00.000Z');
  });

  it('maps hashed profile identifiers without exposing raw IIN/BIN', () => {
    const profile = mapProfile({
      id: 'profile-1',
      user_id: 'user-1',
      type: 'person',
      display_name: 'Test User',
      iin_bin_hash: hashSensitiveValue('850101300349'),
      created_at: new Date('2026-09-04T00:00:00.000Z'),
    });

    expect(profile.iinBin).toBe('[hashed]');
    expect(JSON.stringify(profile)).not.toContain('850101300349');
  });
});

describe('PostgresIdentityRepository persistence contract', () => {
  it('stores refresh tokens as hashes only', async () => {
    const { db, query } = createDbMock({
      id: 'session-1',
      user_id: 'user-1',
      created_at: new Date('2026-09-04T00:00:00.000Z'),
    });
    const repository = new PostgresIdentityRepository(db);

    const session = await repository.createSession({ userId: 'user-1', refreshToken: 'raw-refresh-token' });

    expect(session.refreshToken).toBe('raw-refresh-token');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('refresh_token_hash'), [
      'user-1',
      hashSensitiveValue('raw-refresh-token'),
    ]);
    expect(query.mock.calls[0][1]).not.toContain('raw-refresh-token');
  });

  it('stores profile IIN/BIN as a hash and bank account as encrypted-column bytes', async () => {
    const { db, query } = createDbMock({
      id: 'profile-1',
      user_id: 'user-1',
      type: 'person',
      display_name: 'Test User',
      iin_bin_hash: hashSensitiveValue('850101300349'),
      address: 'Almaty',
      created_at: new Date('2026-09-04T00:00:00.000Z'),
    });
    const repository = new PostgresIdentityRepository(db);

    await repository.createProfile({
      userId: 'user-1',
      type: 'person',
      displayName: 'Test User',
      iinBin: '850101300349',
      address: 'Almaty',
      bankAccount: 'KZ000000000000000000',
    });

    const values = query.mock.calls[0][1];
    expect(values).toContain(hashSensitiveValue('850101300349'));
    expect(values).not.toContain('850101300349');
    expect(Buffer.isBuffer(values[5])).toBe(true);
  });
});

function createDbMock(row: unknown) {
  const query = jest.fn().mockResolvedValue({ rows: [row] });
  return {
    db: { query } as unknown as DatabaseService,
    query,
  };
}
