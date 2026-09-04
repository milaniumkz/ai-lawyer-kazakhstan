import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './identity/identity.module';
import { CasesModule } from './cases/cases.module';

@Module({
  imports: [HealthModule, IdentityModule, CasesModule],
})
export class AppModule {}
