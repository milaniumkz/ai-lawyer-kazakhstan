import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';
import { legalRepositoryProvider } from './repositories/legal-repository.provider';
import { PostgresLegalRepository } from './repositories/postgres-legal.repository';

@Module({
  controllers: [LegalController],
  providers: [LegalService, DatabaseService, PostgresLegalRepository, legalRepositoryProvider],
})
export class LegalModule {}
