import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { LegalController } from './legal.controller';
import { ManualLegalSourceIngestionAdapter } from './integrations/legal-source-ingestion.adapter';
import { LegalService } from './legal.service';
import { legalRepositoryProvider } from './repositories/legal-repository.provider';
import { PostgresLegalRepository } from './repositories/postgres-legal.repository';

@Module({
  controllers: [LegalController],
  providers: [LegalService, DatabaseService, PostgresLegalRepository, legalRepositoryProvider, ManualLegalSourceIngestionAdapter],
  exports: [LegalService],
})
export class LegalModule {}
