import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool =
    process.env.DATABASE_URL && process.env.DATABASE_URL !== ''
      ? new Pool({ connectionString: process.env.DATABASE_URL })
      : undefined;

  async query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    if (!this.pool) throw new Error('DATABASE_URL_NOT_CONFIGURED');
    return this.pool.query<T>(text, values);
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
