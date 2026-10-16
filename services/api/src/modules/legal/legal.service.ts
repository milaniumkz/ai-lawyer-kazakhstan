import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { CitationValidationResult, LegalSourceFragment } from './legal.types';
import { generateOpenAiLegalAnswer, isOpenAiLegalEnabled } from './openai-legal.adapter';
import { LEGAL_REPOSITORY } from './repositories/legal-repository.provider';
import { LegalRepository } from './repositories/legal.repository';
import { generateOpenAiConversation } from './openai-conversation.adapter';
import type { MessageRecord } from '../cases/cases.types';
import { recoverOfficialSources } from './source-recovery';

const OFFICIAL_HOSTS = ['zan.gov.kz', 'adilet.zan.kz', 'sud.gov.kz', 'gov.kz'];

@Injectable()
export class LegalService {
  private readonly fragments = new Map<string, LegalSourceFragment>();

  constructor(@Optional() @Inject(LEGAL_REPOSITORY) private readonly repository?: LegalRepository) {}

  async importFragment(input: Omit<LegalSourceFragment, 'id' | 'retrievedAt' | 'checksum' | 'embeddingVersion'>) {
    assertOfficialSource(input.sourceUrl);
    const fragment: LegalSourceFragment = {
      ...input,
      id: randomUUID(),
      retrievedAt: new Date().toISOString(),
      checksum: checksum(input.text),
      embeddingVersion: 'stub-v1',
    };
    if (this.repository) return this.repository.importFragment(fragment);
    this.fragments.set(fragment.id, fragment);
    return fragment;
  }

  async search(query: string) {
    if (this.repository) return this.repository.searchFragments(query);
    const normalized = query.toLowerCase();
    return [...this.fragments.values()].filter(
      (fragment) =>
        fragment.status === 'active' &&
        (fragment.text.toLowerCase().includes(normalized) || fragment.title.toLowerCase().includes(normalized)),
    );
  }

  async validateCitation(input: { fragmentId?: string; officialId?: string; article?: string; eventDate?: string; quotedText?: string }): Promise<CitationValidationResult> {
    const fragment = this.repository
      ? await findRepositoryFragment(this.repository, input)
      : [...this.fragments.values()].find((candidate) => candidate.id === input.fragmentId || candidate.officialId === input.officialId);
    if (!fragment) return insufficient();
    if (fragment.status !== 'active') return invalid('Источник не находится в действующем статусе.');
    if (input.article && fragment.article !== input.article) return invalid('Статья не принадлежит указанному фрагменту.');
    if (input.eventDate && !isEffective(fragment, input.eventDate)) return invalid('Редакция не применима к указанной дате.');
    if (input.quotedText && !fragment.text.includes(input.quotedText)) return invalid('Цитата не совпадает с официальным фрагментом.');
    return { status: 'confirmed', message: 'Норма подтверждена официальным источником РК.', fragment };
  }

  async answer(query: string, options: {allowWebRecovery?:boolean} = {}) {
    let matches: LegalSourceFragment[];
    try { matches = await this.search(query); }
    catch (error) { if (!isOpenAiLegalEnabled() || options.allowWebRecovery === false) throw error; matches = []; }
    if (!matches.length) {
      if (!isOpenAiLegalEnabled() || options.allowWebRecovery === false) return insufficient();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      try {
        const model = [process.env.OPENAI_MODEL,process.env.AI_COMPLEX_MODEL,process.env.AI_MEDIUM_MODEL].find(value=>value && !value.startsWith('stub-')) || 'gpt-5';
        const citations = await recoverOfficialSources({key:process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',model,signal:controller.signal,query});
        if (!citations.length) return {...insufficient(),message:'Основной источник недоступен или не дал результата. Резервный поиск в интернете выполнен, но подтверждённых норм пока недостаточно.'};
        return {status:'confirmed' as const,aiProvider:'openai',modelId:model,sourceSearch:'web_fallback',citations,
          message:'Нормы найдены резервным поиском и сверены с официальными текстами РК. Применимость к обстоятельствам требует проверки.\n' + citations.map(source=>`${source.title}, статья ${source.article}: ${source.quote}\n${source.url} (редакция ${source.effectiveDate})`).join('\n'),requiredAction:'clarify_or_human_review' as const};
      } catch {
        return {...insufficient(),message:'Основной и резервный поиск временно недоступны. Сведения сохранены; поиск можно повторить.'};
      } finally { clearTimeout(timeout); }
    }
    if (isOpenAiLegalEnabled()) {
      try {
        const generated = await generateOpenAiLegalAnswer({ query, fragment: matches[0] });
        return {
          status: 'confirmed',
          message: generated.message,
          fragment: matches[0],
          aiProvider: generated.provider,
          modelId: generated.modelId,
        };
      } catch {
        return {
          status: 'confirmed',
          message:
            'Найден подтвержденный официальный источник. AI-провайдер временно недоступен, поэтому вывод требует ручной проверки применимости к фактам.',
          fragment: matches[0],
          requiredAction: 'clarify_or_human_review',
        };
      }
    }
    return {
      status: 'confirmed',
      message: 'Найден подтвержденный официальный источник. Итоговый вывод требует проверки применимости к фактам.',
      fragment: matches[0],
    };
  }

  async conversation(problemText: string, messages: MessageRecord[], attachments: import('./openai-conversation.adapter').ConversationAttachment[] = []) {
    if (!isOpenAiLegalEnabled()) return undefined;
    return generateOpenAiConversation(problemText, messages, attachments);
  }
}

async function findRepositoryFragment(repository: LegalRepository, input: { fragmentId?: string; officialId?: string }) {
  if (input.fragmentId) return repository.findFragmentById(input.fragmentId);
  if (input.officialId) return repository.findFragmentByOfficialId(input.officialId);
  return undefined;
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
