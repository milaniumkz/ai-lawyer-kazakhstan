import { Module } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { billingRepositoryProvider } from './repositories/billing-repository.provider';
import { PostgresBillingRepository } from './repositories/postgres-billing.repository';

@Module({
  controllers: [BillingController],
  providers: [BillingService, DatabaseService, PostgresBillingRepository, billingRepositoryProvider],
})
export class BillingModule {}
