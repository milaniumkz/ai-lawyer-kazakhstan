import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { documentsRepositoryProvider } from './repositories/documents-repository.provider';
import { PostgresDocumentsRepository } from './repositories/postgres-documents.repository';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DatabaseService, PostgresDocumentsRepository, documentsRepositoryProvider],
})
export class DocumentsModule {}
