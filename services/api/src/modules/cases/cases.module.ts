import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { PostgresCasesRepository } from './repositories/postgres-cases.repository';

@Module({
  controllers: [CasesController],
  providers: [CasesService, DatabaseService, PostgresCasesRepository],
  exports: [CasesService],
})
export class CasesModule {}
