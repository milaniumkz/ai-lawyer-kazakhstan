import { Body, Controller, Delete, Get, Headers, Post } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { AuthChannel, ProfileType } from './identity.types';

@Controller()
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post('auth/register')
  register(
    @Body() body: { channel: AuthChannel; phone?: string; email?: string; password?: string; consentVersion: string },
    @Headers('x-correlation-id') correlationId = 'local',
  ) {
    return this.identity.register(body, correlationId);
  }

  @Post('auth/otp/verify')
  verifyOtp(@Body() body: { otpId: string; code: string }, @Headers('x-correlation-id') correlationId = 'local') {
    return this.identity.verifyOtp(body, correlationId);
  }

  @Post('auth/login')
  login(@Body() body: { phone?: string; email?: string; password?: string }, @Headers('x-correlation-id') correlationId = 'local') {
    return this.identity.login(body, correlationId);
  }

  @Post('auth/refresh')
  refresh(@Body() body: { refreshToken: string }, @Headers('x-correlation-id') correlationId = 'local') {
    return this.identity.refresh(body, correlationId);
  }

  @Post('auth/logout-all')
  logoutAll(@Body() body: { userId: string }, @Headers('x-correlation-id') correlationId = 'local') {
    return this.identity.logoutAll(body.userId, correlationId);
  }

  @Get('sessions')
  sessions(@Headers('x-user-id') userId = '') {
    return this.identity.listSessions(userId);
  }

  @Post('profiles')
  createProfile(
    @Body() body: { userId: string; type: ProfileType; displayName: string; iinBin?: string; address?: string; bankAccount?: string },
    @Headers('x-correlation-id') correlationId = 'local',
  ) {
    return this.identity.createProfile(body, correlationId);
  }

  @Get('profiles')
  profiles(@Headers('x-user-id') userId = '') {
    return this.identity.listProfiles(userId);
  }

  @Get('account/export')
  exportAccount(@Headers('x-user-id') userId = '', @Headers('x-correlation-id') correlationId = 'local') {
    return this.identity.exportAccount(userId, correlationId);
  }

  @Delete('account')
  deleteAccount(@Headers('x-user-id') userId = '', @Headers('x-correlation-id') correlationId = 'local') {
    return this.identity.deleteAccount(userId, correlationId);
  }

  @Get('admin/audit-events')
  auditEvents() {
    return this.identity.listAuditEvents();
  }
}
