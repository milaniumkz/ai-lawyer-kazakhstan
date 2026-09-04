import { Body, Controller, Delete, Get, Headers, Post } from '@nestjs/common';
import { assertAdminRole } from '../../common/admin-rbac';
import { assertSameUser, assertUserId } from '../../common/user-context';
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
  logoutAll(@Body() body: { userId: string }, @Headers('x-user-id') headerUserId?: string | string[], @Headers('x-correlation-id') correlationId = 'local') {
    const userId = assertSameUser(headerUserId, body.userId);
    return this.identity.logoutAll(userId, correlationId);
  }

  @Get('sessions')
  sessions(@Headers('x-user-id') userId?: string | string[]) {
    return this.identity.listSessions(assertUserId(userId));
  }

  @Post('profiles')
  createProfile(
    @Body() body: { userId: string; type: ProfileType; displayName: string; iinBin?: string; address?: string; bankAccount?: string },
    @Headers('x-user-id') headerUserId?: string | string[],
    @Headers('x-correlation-id') correlationId = 'local',
  ) {
    assertSameUser(headerUserId, body.userId);
    return this.identity.createProfile(body, correlationId);
  }

  @Get('profiles')
  profiles(@Headers('x-user-id') userId?: string | string[]) {
    return this.identity.listProfiles(assertUserId(userId));
  }

  @Get('account/export')
  exportAccount(@Headers('x-user-id') userId?: string | string[], @Headers('x-correlation-id') correlationId = 'local') {
    return this.identity.exportAccount(assertUserId(userId), correlationId);
  }

  @Delete('account')
  deleteAccount(@Headers('x-user-id') userId?: string | string[], @Headers('x-correlation-id') correlationId = 'local') {
    return this.identity.deleteAccount(assertUserId(userId), correlationId);
  }

  @Get('admin/audit-events')
  auditEvents(@Headers('x-user-role') userRole?: string | string[]) {
    assertAdminRole(userRole);
    return this.identity.listAuditEvents();
  }
}
