import { Injectable } from '@nestjs/common';

export type LegalSourceIngestionMode = 'official_api' | 'manual_admin_import' | 'blocked';

export interface OfficialLegalSource {
  code: string;
  title: string;
  host: string;
  requiresPermission: boolean;
}

export interface LegalSourceIngestionBlocker {
  sourceCode: string;
  reason: string;
  fallbackMode: Extract<LegalSourceIngestionMode, 'manual_admin_import'>;
}

export interface LegalSourceIngestionAdapter {
  mode(): LegalSourceIngestionMode;
  officialSources(): OfficialLegalSource[];
  blockers(): LegalSourceIngestionBlocker[];
}

export const OFFICIAL_KZ_LEGAL_SOURCES: OfficialLegalSource[] = [
  { code: 'zan', title: 'zan.gov.kz', host: 'zan.gov.kz', requiresPermission: true },
  { code: 'adilet', title: 'Әділет', host: 'adilet.zan.kz', requiresPermission: true },
  { code: 'courts', title: 'Суды РК', host: 'sud.gov.kz', requiresPermission: true },
  { code: 'state_bodies', title: 'Государственные органы РК', host: 'gov.kz', requiresPermission: true },
];

@Injectable()
export class ManualLegalSourceIngestionAdapter implements LegalSourceIngestionAdapter {
  mode(): LegalSourceIngestionMode {
    return 'manual_admin_import';
  }

  officialSources(): OfficialLegalSource[] {
    return OFFICIAL_KZ_LEGAL_SOURCES;
  }

  blockers(): LegalSourceIngestionBlocker[] {
    return OFFICIAL_KZ_LEGAL_SOURCES.filter((source) => source.requiresPermission).map((source) => ({
      sourceCode: source.code,
      reason: 'Official API permission or documentation is not provided.',
      fallbackMode: 'manual_admin_import',
    }));
  }
}
