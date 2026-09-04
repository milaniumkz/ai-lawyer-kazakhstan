import { ManualLegalSourceIngestionAdapter, OFFICIAL_KZ_LEGAL_SOURCES } from './legal-source-ingestion.adapter';

describe('ManualLegalSourceIngestionAdapter', () => {
  it('declares only official Kazakhstan legal sources', () => {
    const hosts = OFFICIAL_KZ_LEGAL_SOURCES.map((source) => source.host);

    expect(hosts).toEqual(['zan.gov.kz', 'adilet.zan.kz', 'sud.gov.kz', 'gov.kz']);
    expect(hosts.join(' ')).not.toContain('.ru');
  });

  it('uses manual import blockers instead of fake production ingestion', () => {
    const adapter = new ManualLegalSourceIngestionAdapter();

    expect(adapter.mode()).toBe('manual_admin_import');
    expect(adapter.blockers()).toHaveLength(4);
    expect(adapter.blockers().every((blocker) => blocker.fallbackMode === 'manual_admin_import')).toBe(true);
  });
});
