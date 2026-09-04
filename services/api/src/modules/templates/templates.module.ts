import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { PostgresTemplatesRepository } from './repositories/postgres-templates.repository';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, DatabaseService, PostgresTemplatesRepository],
})
export class TemplatesModule {}
