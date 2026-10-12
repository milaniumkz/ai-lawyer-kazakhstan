import { documentsRepositoryProvider } from '../documents/repositories/documents-repository.provider';
import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { casesRepositoryProvider } from './repositories/cases-repository.provider';
import { PostgresCasesRepository } from './repositories/postgres-cases.repository';
import { LegalModule } from '../legal/legal.module';

@Module({
  imports: [LegalModule],
  controllers: [CasesController],
  providers: [CasesService, DatabaseService, PostgresCasesRepository, casesRepositoryProvider, documentsRepositoryProvider],
  exports: [CasesService],
})
export class CasesModule {}
