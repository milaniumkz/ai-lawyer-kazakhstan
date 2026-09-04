import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CasesModule } from '../cases/cases.module';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { PostgresTemplatesRepository } from './repositories/postgres-templates.repository';
import { templatesRepositoryProvider } from './repositories/templates-repository.provider';

@Module({
  imports: [CasesModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, DatabaseService, PostgresTemplatesRepository, templatesRepositoryProvider],
})
export class TemplatesModule {}
