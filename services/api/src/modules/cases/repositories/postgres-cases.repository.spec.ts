import { DatabaseService } from '../../../common/database/database.service';
import { PostgresCasesRepository, mapCase, mapMessage, mapTranscript } from './postgres-cases.repository';

describe('PostgresCasesRepository mapping', () => {
  it('maps legal case rows from migration columns', () => {
    const legalCase = mapCase({
      id: 'case-1',
      owner_user_id: 'user-1',
      profile_id: null,
      title: 'Debt claim',
      problem_text: 'Нужно взыскать долг по расписке',
      category: 'civil_contract',
      subcategory: 'debt_collection',
      confidence: '0.820',
      status: 'consultation',
      readiness_percent: 17,
      created_at: new Date('2026-09-04T00:00:00.000Z'),
    });

    expect(legalCase.ownerUserId).toBe('user-1');
    expect(legalCase.confidence).toBe(0.82);
    expect(legalCase.createdAt).toBe('2026-09-04T00:00:00.000Z');
  });

  it('maps messages and transcript jobs', () => {
    expect(
      mapMessage({
        id: 'message-1',
        case_id: 'case-1',
        role: 'assistant',
        text: 'Ответ только по праву РК',
        created_at: new Date('2026-09-04T00:00:00.000Z'),
      }),
    ).toMatchObject({ caseId: 'case-1', role: 'assistant' });

    expect(
      mapTranscript({
        id: 'transcript-1',
        case_id: null,
        status: 'ready',
        language: 'ru',
        transcript: 'текст',
        low_confidence_fragments: ['неразборчиво'],
        created_at: new Date('2026-09-04T00:00:00.000Z'),
      }),
    ).toMatchObject({ caseId: undefined, lowConfidenceFragments: ['неразборчиво'] });
  });
});

describe('PostgresCasesRepository persistence contract', () => {
  it('creates cases using legal_cases migration columns', async () => {
    const { db, query } = createDbMock(caseRow());
    const repository = new PostgresCasesRepository(db);

    await repository.createCase({
      ownerUserId: 'user-1',
      title: 'Debt claim',
      problemText: 'Нужно взыскать долг по расписке',
      category: 'civil_contract',
      subcategory: 'debt_collection',
      confidence: 0.82,
      status: 'consultation',
      readinessPercent: 17,
    });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO legal_cases'), [
      'user-1',
      null,
      'Debt claim',
      'Нужно взыскать долг по расписке',
      'civil_contract',
      'debt_collection',
      0.82,
      'consultation',
      17,
    ]);
  });

  it('persists idempotency keys separately from legal case data', async () => {
    const { db, query } = createDbMock(undefined);
    const repository = new PostgresCasesRepository(db);

    await repository.rememberIdempotencyKey({ key: 'idem-1', ownerUserId: 'user-1', caseId: 'case-1' });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('case_idempotency_keys'), ['idem-1', 'user-1', 'case-1']);
    expect(query.mock.calls[0][0]).toContain('ON CONFLICT (key) DO NOTHING');
  });

  it('creates transcript jobs with progress status fields', async () => {
    const { db, query } = createDbMock({
      id: 'transcript-1',
      case_id: 'case-1',
      status: 'ready',
      language: 'ru',
      transcript: 'текст',
      low_confidence_fragments: [],
      created_at: new Date('2026-09-04T00:00:00.000Z'),
    });
    const repository = new PostgresCasesRepository(db);

    await repository.createTranscript({
      caseId: 'case-1',
      status: 'ready',
      language: 'ru',
      transcript: 'текст',
      lowConfidenceFragments: [],
    });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO transcript_jobs'), [
      'case-1',
      'ready',
      'ru',
      'текст',
      [],
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});

function createDbMock(row: unknown) {
  const query = jest.fn().mockResolvedValue({ rows: row ? [row] : [] });
  return {
    db: { query } as unknown as DatabaseService,
    query,
  };
}

function caseRow() {
  return {
    id: 'case-1',
    owner_user_id: 'user-1',
    profile_id: null,
    title: 'Debt claim',
    problem_text: 'Нужно взыскать долг по расписке',
    category: 'civil_contract',
    subcategory: 'debt_collection',
    confidence: 0.82,
    status: 'consultation',
    readiness_percent: 17,
    created_at: new Date('2026-09-04T00:00:00.000Z'),
  };
}
