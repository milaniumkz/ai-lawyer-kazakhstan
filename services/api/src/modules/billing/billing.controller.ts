import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { assertAdminRole } from '../../common/admin-rbac';
import { BillingService } from './billing.service';
import { AiUsageEvent, ProviderConfig } from './billing.types';

@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('subscriptions/current')
  current(@Headers('x-user-id') userId = '') {
    return this.billing.budgetStatus(userId);
  }

  @Post('usage/ai')
  recordUsage(@Body() body: Omit<AiUsageEvent, 'id' | 'createdAt'>, @Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.billing.recordUsage(body);
  }

  @Get('admin/providers')
  providers(@Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.billing.listProviders();
  }

  @Post('admin/providers')
  setProvider(@Body() body: ProviderConfig, @Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.billing.setProvider(body);
  }
}
