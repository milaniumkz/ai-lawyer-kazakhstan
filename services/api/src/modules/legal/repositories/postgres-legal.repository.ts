import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { LegalSourceFragment } from '../legal.types';
import { LegalRepository } from './legal.repository';

@Injectable()
export class PostgresLegalRepository implements LegalRepository {
  constructor(private readonly db: DatabaseService) {}

  async importFragment(input: Omit<LegalSourceFragment, 'id' | 'retrievedAt'>) {
    const result = await this.db.query<LegalSourceFragmentRow>(
      `INSERT INTO legal_source_fragments
        (official_id, title, source_type, authority, language, article, point, text, source_url,
         effective_from, effective_to, checksum, source_version, embedding_version, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        input.officialId,
        input.title,
        input.sourceType,
        input.authority,
        input.language,
        input.article ?? null,
        input.point ?? null,
        input.text,
        input.sourceUrl,
        input.effectiveFrom,
        input.effectiveTo ?? null,
        input.checksum,
        input.sourceVersion,
        input.embeddingVersion,
        input.status,
      ],
    );
    return mapLegalSourceFragment(result.rows[0]!);
  }

  async findFragmentById(id: string) {
    const result = await this.db.query<LegalSourceFragmentRow>('SELECT * FROM legal_source_fragments WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapLegalSourceFragment(result.rows[0]) : undefined;
  }

  async findFragmentByOfficialId(officialId: string) {
    const result = await this.db.query<LegalSourceFragmentRow>(
      'SELECT * FROM legal_source_fragments WHERE official_id = $1 ORDER BY retrieved_at DESC LIMIT 1',
      [officialId],
    );
    return result.rows[0] ? mapLegalSourceFragment(result.rows[0]) : undefined;
  }

  async searchFragments(query: string) {
    const result = await this.db.query<LegalSourceFragmentRow>(
      `SELECT *
       FROM legal_source_fragments
       WHERE status = 'active'
         AND (text ILIKE $1 OR title ILIKE $1 OR official_id ILIKE $1)
       ORDER BY retrieved_at DESC
       LIMIT 20`,
      [`%${query}%`],
    );
    return result.rows.map(mapLegalSourceFragment);
  }
}

interface LegalSourceFragmentRow {
  id: string;
  official_id: string;
  title: string;
  source_type: string;
  authority: string;
  language: LegalSourceFragment['language'];
  article?: string | null;
  point?: string | null;
  text: string;
  source_url: string;
  retrieved_at: Date;
  effective_from: Date;
  effective_to?: Date | null;
  checksum: string;
  source_version: string;
  embedding_version: string;
  status: LegalSourceFragment['status'];
}

export function mapLegalSourceFragment(row: LegalSourceFragmentRow): LegalSourceFragment {
  return {
    id: row.id,
    officialId: row.official_id,
    title: row.title,
    sourceType: row.source_type,
    authority: row.authority,
    language: row.language,
    article: row.article ?? undefined,
    point: row.point ?? undefined,
    text: row.text,
    sourceUrl: row.source_url,
    retrievedAt: row.retrieved_at.toISOString(),
    effectiveFrom: row.effective_from.toISOString(),
    effectiveTo: row.effective_to?.toISOString(),
    checksum: row.checksum,
    sourceVersion: row.source_version,
    embeddingVersion: row.embedding_version,
    status: row.status,
  };
}
