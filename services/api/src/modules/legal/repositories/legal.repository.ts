import { LegalSourceFragment } from '../legal.types';

export interface LegalRepository {
  importFragment(input: Omit<LegalSourceFragment, 'id' | 'retrievedAt'>): Promise<LegalSourceFragment>;
  findFragmentById(id: string): Promise<LegalSourceFragment | undefined>;
  findFragmentByOfficialId(officialId: string): Promise<LegalSourceFragment | undefined>;
  searchFragments(query: string): Promise<LegalSourceFragment[]>;
}
