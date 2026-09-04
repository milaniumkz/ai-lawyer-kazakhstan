import { DatabaseService } from '../../../common/database/database.service';
import { PostgresTemplatesRepository, mapGeneratedDocument, mapTemplate } from './postgres-templates.repository';

describe('PostgresTemplatesRepository mapping', () => {
  it('maps template rows from baseline columns', () => {
    expect(mapTemplate(templateRow())).toMatchObject({
      id: 'tpl-pretrial-claim-ru-v1',
      requiredFields: ['claimantName', 'respondentName'],
      status: 'expert_review',
    });
  });

  it('maps generated document rows', () => {
    expect(mapGeneratedDocument(generatedRow())).toMatchObject({
      templateId: 'tpl-pretrial-claim-ru-v1',
      caseId: 'case-1',
      expertReviewRequired: true,
    });
  });
});

describe('PostgresTemplatesRepository persistence contract', () => {
  it('lists non-archived templates only', async () => {
    const { db, query } = createDbMock(templateRow());
    const repository = new PostgresTemplatesRepository(db);

    await repository.listTemplates();

    expect(query).toHaveBeenCalledWith(expect.stringContaining('status <> $1'), ['archived']);
  });

  it('creates generated documents requiring user confirmation/review metadata', async () => {
    const { db, query } = createDbMock(generatedRow());
    const repository = new PostgresTemplatesRepository(db);

    await repository.createGeneratedDocument({
      templateId: 'tpl-pretrial-claim-ru-v1',
      caseId: 'case-1',
      status: 'draft_requires_user_confirmation',
      title: 'Досудебная претензия',
      body: 'Проект документа',
      expertReviewRequired: true,
    });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO generated_documents'), [
      'tpl-pretrial-claim-ru-v1',
      'case-1',
      'draft_requires_user_confirmation',
      'Досудебная претензия',
      'Проект документа',
      true,
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

function templateRow() {
  return {
    id: 'tpl-pretrial-claim-ru-v1',
    code: 'pretrial_claim',
    title: 'Досудебная претензия',
    language: 'ru' as const,
    status: 'expert_review' as const,
    version: 'v1',
    required_fields: ['claimantName', 'respondentName'],
    body: 'body',
  };
}

function generatedRow() {
  return {
    id: 'generated-1',
    template_id: 'tpl-pretrial-claim-ru-v1',
    case_id: 'case-1',
    status: 'draft_requires_user_confirmation' as const,
    title: 'Досудебная претензия',
    body: 'Проект документа',
    expert_review_required: true,
    created_at: new Date('2026-09-04T00:00:00.000Z'),
  };
}
