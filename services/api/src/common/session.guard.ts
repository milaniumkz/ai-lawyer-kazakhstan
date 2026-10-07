import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { IdentityService } from '../modules/identity/identity.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly identity: IdentityService) {}
  async canActivate(context: ExecutionContext) {
    const secure = ['staging', 'production'].includes(process.env.APP_ENV ?? '') || process.env.AUTH_MODE === 'secure';
    if (!secure) return true; // Explicit local fixtures only; staging/production cannot opt out.
    const request = context.switchToHttp().getRequest<{ url: string; headers: Record<string, string | string[] | undefined> }>();
    const path = request.url.split('?')[0];
    if (['/api/v1/health', '/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/auth/otp/verify', '/api/v1/auth/refresh'].includes(path)) return true;
    const authorization = request.headers.authorization;
    const cookie = typeof request.headers.cookie === 'string' ? request.headers.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('aizan_session='))?.slice('aizan_session='.length) : undefined;
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice(7) : cookie;
    if (!token || !/^[A-Za-z0-9_-]{32,256}$/.test(token)) throw new UnauthorizedException('SESSION_REQUIRED');
    if (cookie && request.headers['sec-fetch-site'] === 'cross-site') throw new ForbiddenException('CROSS_SITE_SESSION_DENIED');
    const user = await this.identity.authenticateSession(token);
    const claimedId = request.headers['x-user-id'];
    if (claimedId && claimedId !== user.id) throw new ForbiddenException('USER_ID_MISMATCH');
    request.headers['x-user-id'] = user.id;
    // A caller never selects its own role. Controllers continue using existing RBAC checks.
    request.headers['x-user-role'] = ['superadmin', 'admin', 'legal_expert', 'support_operator'].find(role => user.roles.includes(role as typeof user.roles[number])) ?? 'user';
    return true;
  }
}
