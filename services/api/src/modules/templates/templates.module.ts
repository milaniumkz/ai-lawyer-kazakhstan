import { CaseActivityService } from './case-activity.service';
import { CaseActivityController } from './case-activity.controller';
import { GenerationJobsService } from './generation-jobs.service';
import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CasesModule } from '../cases/cases.module';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { PostgresTemplatesRepository } from './repositories/postgres-templates.repository';
import { templatesRepositoryProvider } from './repositories/templates-repository.provider';

@Module({
  imports: [CasesModule],
  controllers: [TemplatesController, CaseActivityController],
  providers: [CaseActivityService, GenerationJobsService, TemplatesService, DatabaseService, PostgresTemplatesRepository, templatesRepositoryProvider],
})
export class TemplatesModule {}
