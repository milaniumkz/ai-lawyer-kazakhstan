import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PostgresDocumentsRepository } from './repositories/postgres-documents.repository';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DatabaseService, PostgresDocumentsRepository],
})
export class DocumentsModule {}
