import { DatabaseService } from '../../../common/database/database.service';
import { PostgresLegalRepository, mapLegalSourceFragment } from './postgres-legal.repository';

describe('PostgresLegalRepository mapping', () => {
  it('maps legal source fragments from pgvector baseline columns', () => {
    const fragment = mapLegalSourceFragment(fragmentRow());

    expect(fragment.officialId).toBe('adilet:code:123');
    expect(fragment.sourceUrl).toBe('https://adilet.zan.kz/rus/docs/K123');
    expect(fragment.effectiveFrom).toBe('2026-01-01T00:00:00.000Z');
    expect(fragment.status).toBe('active');
  });
});

describe('PostgresLegalRepository persistence contract', () => {
  it('imports source fragments without writing unofficial ingestion metadata', async () => {
    const { db, query } = createDbMock(fragmentRow());
    const repository = new PostgresLegalRepository(db);

    await repository.importFragment({
      officialId: 'adilet:code:123',
      title: 'Гражданский кодекс РК',
      sourceType: 'code',
      authority: 'Әділет',
      language: 'ru',
      article: '9',
      point: '1',
      text: 'Защита гражданских прав осуществляется судом.',
      sourceUrl: 'https://adilet.zan.kz/rus/docs/K123',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      checksum: 'checksum123',
      sourceVersion: '2026-01-01',
      embeddingVersion: 'stub-v1',
      status: 'active',
    });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO legal_source_fragments'), [
      'adilet:code:123',
      'Гражданский кодекс РК',
      'code',
      'Әділет',
      'ru',
      '9',
      '1',
      'Защита гражданских прав осуществляется судом.',
      'https://adilet.zan.kz/rus/docs/K123',
      '2026-01-01T00:00:00.000Z',
      null,
      'checksum123',
      '2026-01-01',
      'stub-v1',
      'active',
    ]);
  });

  it('searches only active official fragments with bounded results', async () => {
    const { db, query } = createDbMock(fragmentRow());
    const repository = new PostgresLegalRepository(db);

    await repository.searchFragments('алименты');

    expect(query.mock.calls[0][0]).toContain("status = 'active'");
    expect(query.mock.calls[0][0]).toContain('LIMIT 20');
    expect(query.mock.calls[0][1]).toEqual(['%алименты%']);
  });
});

function createDbMock(row: unknown) {
  const query = jest.fn().mockResolvedValue({ rows: row ? [row] : [] });
  return {
    db: { query } as unknown as DatabaseService,
    query,
  };
}

function fragmentRow() {
  return {
    id: 'fragment-1',
    official_id: 'adilet:code:123',
    title: 'Гражданский кодекс РК',
    source_type: 'code',
    authority: 'Әділет',
    language: 'ru' as const,
    article: '9',
    point: '1',
    text: 'Защита гражданских прав осуществляется судом.',
    source_url: 'https://adilet.zan.kz/rus/docs/K123',
    retrieved_at: new Date('2026-09-04T00:00:00.000Z'),
    effective_from: new Date('2026-01-01T00:00:00.000Z'),
    effective_to: null,
    checksum: 'checksum123',
    source_version: '2026-01-01',
    embedding_version: 'stub-v1',
    status: 'active' as const,
  };
}
