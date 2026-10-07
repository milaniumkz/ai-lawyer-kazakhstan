import { APP_GUARD } from '@nestjs/core';
import { SessionGuard } from '../common/session.guard';
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './identity/identity.module';
import { CasesModule } from './cases/cases.module';
import { DocumentsModule } from './documents/documents.module';
import { LegalModule } from './legal/legal.module';
import { TemplatesModule } from './templates/templates.module';
import { BillingModule } from './billing/billing.module';

@Module({
  providers: [{ provide: APP_GUARD, useClass: SessionGuard }],
  imports: [HealthModule, IdentityModule, CasesModule, DocumentsModule, LegalModule, TemplatesModule, BillingModule],
})
export class AppModule {}
