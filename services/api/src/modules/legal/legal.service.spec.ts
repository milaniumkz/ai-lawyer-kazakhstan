import { BadRequestException } from '@nestjs/common';
import { LegalService, assertOfficialSource } from './legal.service';
import { LegalRepository } from './repositories/legal.repository';

const fragment = {
  officialId: 'adilet:test:001',
  title: 'Тестовый официальный фрагмент',
  sourceType: 'law',
  authority: 'Республика Казахстан',
  language: 'ru' as const,
  article: '1',
  text: 'Официальный тестовый фрагмент о взыскании долга.',
  sourceUrl: 'https://adilet.zan.kz/rus/docs/test',
  effectiveFrom: '2024-01-01T00:00:00.000Z',
  sourceVersion: '2024-01-01',
  status: 'active' as const,
};

describe('LegalService', () => {
  it('imports official source and confirms matching citation', async () => {
    const service = new LegalService();
    const imported = await service.importFragment(fragment);
    const result = await service.validateCitation({ fragmentId: imported.id, article: '1', quotedText: 'взыскании долга' });

    expect(result.status).toBe('confirmed');
  });

  it('returns safe refusal when no source exists', async () => {
    const service = new LegalService();

    expect((await service.answer('несуществующая статья')).status).toBe('insufficient_authoritative_sources');
  });

  it('rejects non-official sources and invalid citations', async () => {
    const service = new LegalService();
    expect(() => assertOfficialSource('https://example.com/law')).toThrow(BadRequestException);
    const imported = await service.importFragment({ ...fragment, status: 'cancelled' });

    expect((await service.validateCitation({ fragmentId: imported.id })).status).toBe('invalid');
  });

  it('rejects future or non-applicable editions', async () => {
    const service = new LegalService();
    const imported = await service.importFragment({ ...fragment, effectiveFrom: '2026-01-01T00:00:00.000Z' });

    expect((await service.validateCitation({ fragmentId: imported.id, eventDate: '2025-01-01T00:00:00.000Z' })).status).toBe('invalid');
  });

  it('uses configured repository for persistent legal source flow', async () => {
    const repository = createRepositoryMock();
    const service = new LegalService(repository);

    const imported = await service.importFragment(fragment);
    const citation = await service.validateCitation({ officialId: fragment.officialId, article: '1' });
    const answer = await service.answer('долга');

    expect(imported.id).toBe('fragment-1');
    expect(citation.status).toBe('confirmed');
    expect(answer.status).toBe('confirmed');
    expect(repository.importFragment).toHaveBeenCalledWith(expect.objectContaining({ checksum: expect.any(String), embeddingVersion: 'stub-v1' }));
    expect(repository.findFragmentByOfficialId).toHaveBeenCalledWith(fragment.officialId);
    expect(repository.searchFragments).toHaveBeenCalledWith('долга');
  });
});

function createRepositoryMock(): jest.Mocked<LegalRepository> {
  const stored = {
    id: 'fragment-1',
    retrievedAt: '2026-09-04T00:00:00.000Z',
    checksum: 'checksum123',
    embeddingVersion: 'stub-v1',
    ...fragment,
  };
  return {
    importFragment: jest.fn().mockResolvedValue(stored),
    findFragmentById: jest.fn().mockResolvedValue(stored),
    findFragmentByOfficialId: jest.fn().mockResolvedValue(stored),
    searchFragments: jest.fn().mockResolvedValue([stored]),
  };
}
