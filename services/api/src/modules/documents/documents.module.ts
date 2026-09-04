import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CasesModule } from '../cases/cases.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { documentsRepositoryProvider } from './repositories/documents-repository.provider';
import { PostgresDocumentsRepository } from './repositories/postgres-documents.repository';

@Module({
  imports: [CasesModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DatabaseService, PostgresDocumentsRepository, documentsRepositoryProvider],
})
export class DocumentsModule {}
