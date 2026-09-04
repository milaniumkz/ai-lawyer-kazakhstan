import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
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
  recordUsage(@Body() body: Omit<AiUsageEvent, 'id' | 'createdAt'>) {
    return this.billing.recordUsage(body);
  }

  @Get('admin/providers')
  providers() {
    return this.billing.listProviders();
  }

  @Post('admin/providers')
  setProvider(@Body() body: ProviderConfig) {
    return this.billing.setProvider(body);
  }
}
