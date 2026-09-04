import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { PostgresIdentityRepository } from './repositories/postgres-identity.repository';

@Module({
  controllers: [IdentityController],
  providers: [IdentityService, DatabaseService, PostgresIdentityRepository],
  exports: [IdentityService],
})
export class IdentityModule {}
