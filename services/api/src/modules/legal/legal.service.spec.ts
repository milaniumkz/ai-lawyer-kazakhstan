import { BadRequestException } from '@nestjs/common';
import { LegalService, assertOfficialSource } from './legal.service';

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
  it('imports official source and confirms matching citation', () => {
    const service = new LegalService();
    const imported = service.importFragment(fragment);
    const result = service.validateCitation({ fragmentId: imported.id, article: '1', quotedText: 'взыскании долга' });

    expect(result.status).toBe('confirmed');
  });

  it('returns safe refusal when no source exists', () => {
    const service = new LegalService();

    expect(service.answer('несуществующая статья').status).toBe('insufficient_authoritative_sources');
  });

  it('rejects non-official sources and invalid citations', () => {
    const service = new LegalService();
    expect(() => assertOfficialSource('https://example.com/law')).toThrow(BadRequestException);
    const imported = service.importFragment({ ...fragment, status: 'cancelled' });

    expect(service.validateCitation({ fragmentId: imported.id }).status).toBe('invalid');
  });

  it('rejects future or non-applicable editions', () => {
    const service = new LegalService();
    const imported = service.importFragment({ ...fragment, effectiveFrom: '2026-01-01T00:00:00.000Z' });

    expect(service.validateCitation({ fragmentId: imported.id, eventDate: '2025-01-01T00:00:00.000Z' }).status).toBe('invalid');
  });
});
