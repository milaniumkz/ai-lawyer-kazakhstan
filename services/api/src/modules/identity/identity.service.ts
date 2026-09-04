import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { AuditEvent, AuthChannel, ProfileRecord, ProfileType, SessionRecord, UserRecord } from './identity.types';

const OTP_CODE = '111111';
const OTP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class IdentityService {
  private readonly users = new Map<string, UserRecord>();
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly profiles = new Map<string, ProfileRecord>();
  private readonly otpRequests = new Map<string, { channel: AuthChannel; phone?: string; email?: string; expiresAt: number; consentVersion: string; passwordHash?: string }>();
  private readonly rateLimits = new Map<string, { count: number; resetAt: number }>();
  private readonly auditEvents: AuditEvent[] = [];

  register(input: { channel: AuthChannel; phone?: string; email?: string; password?: string; consentVersion: string }, correlationId: string) {
    this.assertChannel(input.channel, input.phone, input.email);
    this.checkRateLimit(input.phone ?? input.email ?? 'anonymous');
    if (!input.consentVersion) throw new BadRequestException('CONSENT_VERSION_REQUIRED');

    const otpId = randomUUID();
    this.otpRequests.set(otpId, {
      channel: input.channel,
      phone: input.phone,
      email: input.email,
      consentVersion: input.consentVersion,
      passwordHash: input.password ? this.hash(input.password) : undefined,
      expiresAt: Date.now() + OTP_TTL_MS,
    });
    this.audit('otp_requested', undefined, otpId, { channel: input.channel }, correlationId);

    return { otpId, expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(), deliveryMode: 'stub', testCode: OTP_CODE };
  }

  verifyOtp(input: { otpId: string; code: string }, correlationId: string) {
    const otp = this.otpRequests.get(input.otpId);
    if (!otp || otp.expiresAt < Date.now()) throw new UnauthorizedException('OTP_EXPIRED_OR_UNKNOWN');
    if (input.code !== OTP_CODE) throw new UnauthorizedException('OTP_INVALID');

    const existing = [...this.users.values()].find((user) => user.phone === otp.phone || user.email === otp.email);
    const user =
      existing ??
      this.createUser({
        channel: otp.channel,
        phone: otp.phone,
        email: otp.email,
        passwordHash: otp.passwordHash,
        consentVersion: otp.consentVersion,
      });
    this.otpRequests.delete(input.otpId);
    this.audit('login', user.id, user.id, { channel: user.channel }, correlationId);
    return this.issueTokens(user, correlationId);
  }

  login(input: { phone?: string; email?: string; password?: string }, correlationId: string) {
    const user = [...this.users.values()].find((candidate) => candidate.phone === input.phone || candidate.email === input.email);
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');
    if (user.passwordHash && this.hash(input.password ?? '') !== user.passwordHash) {
      this.audit('failed_login', undefined, user.id, { channel: user.channel }, correlationId);
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    this.audit('login', user.id, user.id, { channel: user.channel }, correlationId);
    return this.issueTokens(user, correlationId);
  }

  refresh(input: { refreshToken: string }, correlationId: string) {
    const session = [...this.sessions.values()].find((candidate) => candidate.refreshToken === input.refreshToken && !candidate.revokedAt);
    if (!session) throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    session.revokedAt = new Date().toISOString();
    const user = this.mustGetUser(session.userId);
    this.audit('refresh_rotated', user.id, session.id, {}, correlationId);
    return this.issueTokens(user, correlationId);
  }

  logoutAll(userId: string, correlationId: string) {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.revokedAt) session.revokedAt = new Date().toISOString();
    }
    this.audit('logout_all_devices', userId, userId, {}, correlationId);
    return { revoked: true };
  }

  listSessions(userId: string) {
    return [...this.sessions.values()]
      .filter((session) => session.userId === userId)
      .map((session) => ({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        revokedAt: session.revokedAt,
      }));
  }

  createProfile(input: { userId: string; type: ProfileType; displayName: string; iinBin?: string; address?: string; bankAccount?: string }, correlationId: string) {
    this.mustGetUser(input.userId);
    if (!input.displayName) throw new BadRequestException('DISPLAY_NAME_REQUIRED');
    if (input.iinBin && !isValidIinBin(input.iinBin)) throw new BadRequestException('IIN_BIN_INVALID');

    const profile: ProfileRecord = {
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      displayName: input.displayName,
      iinBin: input.iinBin,
      address: input.address,
      bankAccount: input.bankAccount,
      createdAt: new Date().toISOString(),
    };
    this.profiles.set(profile.id, profile);
    this.audit('profile_created', input.userId, profile.id, { type: input.type, iinBin: maskIinBin(input.iinBin) }, correlationId);
    return { ...profile, iinBin: maskIinBin(profile.iinBin) };
  }

  listProfiles(userId: string) {
    return [...this.profiles.values()]
      .filter((profile) => profile.userId === userId)
      .map((profile) => ({ ...profile, iinBin: maskIinBin(profile.iinBin) }));
  }

  listAuditEvents() {
    return this.auditEvents.slice(-100).reverse();
  }

  private createUser(input: { channel: AuthChannel; phone?: string; email?: string; passwordHash?: string; consentVersion: string }) {
    const user: UserRecord = {
      id: randomUUID(),
      channel: input.channel,
      phone: input.phone,
      email: input.email,
      passwordHash: input.passwordHash,
      roles: ['user'],
      consentVersion: input.consentVersion,
      createdAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    return user;
  }

  private issueTokens(user: UserRecord, correlationId: string) {
    const session: SessionRecord = {
      id: randomUUID(),
      userId: user.id,
      refreshToken: `stub_refresh_${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    this.audit('session_created', user.id, session.id, {}, correlationId);
    return {
      accessToken: `stub_access_${user.id}`,
      refreshToken: session.refreshToken,
      tokenType: 'Bearer',
      user: { id: user.id, roles: user.roles, consentVersion: user.consentVersion },
    };
  }

  private assertChannel(channel: AuthChannel, phone?: string, email?: string) {
    if (channel === 'phone' && !/^\+7\d{10}$/.test(phone ?? '')) throw new BadRequestException('PHONE_INVALID');
    if (channel === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) throw new BadRequestException('EMAIL_INVALID');
  }

  private checkRateLimit(subject: string) {
    const now = Date.now();
    const bucket = this.rateLimits.get(subject);
    if (!bucket || bucket.resetAt < now) {
      this.rateLimits.set(subject, { count: 1, resetAt: now + 60_000 });
      return;
    }
    bucket.count += 1;
    if (bucket.count > 5) throw new HttpException('RATE_LIMITED', HttpStatus.TOO_MANY_REQUESTS);
  }

  private mustGetUser(userId: string) {
    const user = this.users.get(userId);
    if (!user) throw new UnauthorizedException('USER_NOT_FOUND');
    return user;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private audit(action: string, actorUserId: string | undefined, targetId: string | undefined, metadata: AuditEvent['metadata'], correlationId: string) {
    this.auditEvents.push({ id: randomUUID(), action, actorUserId, targetId, metadata, correlationId, createdAt: new Date().toISOString() });
  }
}

export function maskIinBin(value?: string) {
  return value ? `${value.slice(0, 3)}******${value.slice(-3)}` : undefined;
}

export function isValidIinBin(value: string) {
  if (!/^\d{12}$/.test(value)) return false;
  const digits = [...value].map(Number);
  const firstWeights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const secondWeights = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
  const checksum = (weights: number[]) => weights.reduce((sum, weight, index) => sum + weight * digits[index], 0) % 11;
  const first = checksum(firstWeights);
  const control = first === 10 ? checksum(secondWeights) : first;
  return control !== 10 && control === digits[11];
}
