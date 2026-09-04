import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './identity/identity.module';
import { CasesModule } from './cases/cases.module';
import { DocumentsModule } from './documents/documents.module';
import { LegalModule } from './legal/legal.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [HealthModule, IdentityModule, CasesModule, DocumentsModule, LegalModule, TemplatesModule],
})
export class AppModule {}
