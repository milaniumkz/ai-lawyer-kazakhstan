import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { CitationValidationResult, LegalSourceFragment } from './legal.types';

const OFFICIAL_HOSTS = ['zan.gov.kz', 'adilet.zan.kz', 'sud.gov.kz', 'gov.kz'];

@Injectable()
export class LegalService {
  private readonly fragments = new Map<string, LegalSourceFragment>();

  importFragment(input: Omit<LegalSourceFragment, 'id' | 'retrievedAt' | 'checksum' | 'embeddingVersion'>) {
    assertOfficialSource(input.sourceUrl);
    const fragment: LegalSourceFragment = {
      ...input,
      id: randomUUID(),
      retrievedAt: new Date().toISOString(),
      checksum: checksum(input.text),
      embeddingVersion: 'stub-v1',
    };
    this.fragments.set(fragment.id, fragment);
    return fragment;
  }

  search(query: string) {
    const normalized = query.toLowerCase();
    return [...this.fragments.values()].filter(
      (fragment) =>
        fragment.status === 'active' &&
        (fragment.text.toLowerCase().includes(normalized) || fragment.title.toLowerCase().includes(normalized)),
    );
  }

  validateCitation(input: { fragmentId?: string; officialId?: string; article?: string; eventDate?: string; quotedText?: string }): CitationValidationResult {
    const fragment = [...this.fragments.values()].find(
      (candidate) => candidate.id === input.fragmentId || candidate.officialId === input.officialId,
    );
    if (!fragment) return insufficient();
    if (fragment.status !== 'active') return invalid('Источник не находится в действующем статусе.');
    if (input.article && fragment.article !== input.article) return invalid('Статья не принадлежит указанному фрагменту.');
    if (input.eventDate && !isEffective(fragment, input.eventDate)) return invalid('Редакция не применима к указанной дате.');
    if (input.quotedText && !fragment.text.includes(input.quotedText)) return invalid('Цитата не совпадает с официальным фрагментом.');
    return { status: 'confirmed', message: 'Норма подтверждена официальным источником РК.', fragment };
  }

  answer(query: string) {
    const matches = this.search(query);
    if (!matches.length) return insufficient();
    return {
      status: 'confirmed',
      message: 'Найден подтвержденный официальный источник. Итоговый вывод требует проверки применимости к фактам.',
      fragment: matches[0],
    };
  }
}

export function assertOfficialSource(sourceUrl: string) {
  let host = '';
  try {
    host = new URL(sourceUrl).hostname;
  } catch {
    throw new BadRequestException('SOURCE_URL_INVALID');
  }
  if (!OFFICIAL_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    throw new BadRequestException('SOURCE_NOT_OFFICIAL_KZ');
  }
}

function insufficient(): CitationValidationResult {
  return {
    status: 'insufficient_authoritative_sources',
    message: 'В официальных источниках не найдено достаточного подтверждения для точного ответа.',
    requiredAction: 'clarify_or_human_review',
  };
}

function invalid(message: string): CitationValidationResult {
  return { status: 'invalid', message, requiredAction: 'clarify_or_human_review' };
}

function isEffective(fragment: LegalSourceFragment, eventDate: string) {
  const event = new Date(eventDate).getTime();
  const from = new Date(fragment.effectiveFrom).getTime();
  const to = fragment.effectiveTo ? new Date(fragment.effectiveTo).getTime() : Number.POSITIVE_INFINITY;
  return event >= from && event <= to;
}

function checksum(text: string) {
  return createHash('sha256').update(text).digest('hex');
}
