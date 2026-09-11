import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import {
  AuditEvent,
  AuthChannel,
  ProfileRecord,
  ProfileType,
  SessionRecord,
  UserRecord,
} from "./identity.types";
import { IDENTITY_REPOSITORY } from "./repositories/identity-repository.provider";
import { IdentityRepository } from "./repositories/identity.repository";

const OTP_CODE = "111111";
const OTP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class IdentityService {
  private readonly users = new Map<string, UserRecord>();
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly profiles = new Map<string, ProfileRecord>();
  private readonly otpRequests = new Map<
    string,
    {
      channel: AuthChannel;
      phone?: string;
      email?: string;
      expiresAt: number;
      consentVersion: string;
      passwordHash?: string;
    }
  >();
  private readonly rateLimits = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private readonly auditEvents: AuditEvent[] = [];

  constructor(
    @Optional()
    @Inject(IDENTITY_REPOSITORY)
    private readonly repository?: IdentityRepository,
  ) {}

  register(
    input: {
      channel: AuthChannel;
      phone?: string;
      email?: string;
      password?: string;
      consentVersion: string;
    },
    correlationId: string,
  ) {
    this.assertChannel(input.channel, input.phone, input.email);
    this.checkRateLimit(input.phone ?? input.email ?? "anonymous");
    if (!input.consentVersion)
      throw new BadRequestException("CONSENT_VERSION_REQUIRED");

    const otpId = randomUUID();
    this.otpRequests.set(otpId, {
      channel: input.channel,
      phone: input.phone,
      email: input.email,
      consentVersion: input.consentVersion,
      passwordHash: input.password ? this.hash(input.password) : undefined,
      expiresAt: Date.now() + OTP_TTL_MS,
    });
    this.audit(
      "otp_requested",
      undefined,
      otpId,
      { channel: input.channel },
      correlationId,
    );

    return {
      otpId,
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      deliveryMode: "stub",
      testCode: OTP_CODE,
    };
  }

  async verifyOtp(
    input: { otpId: string; code: string },
    correlationId: string,
  ) {
    const otp = this.otpRequests.get(input.otpId);
    if (!otp || otp.expiresAt < Date.now())
      throw new UnauthorizedException("OTP_EXPIRED_OR_UNKNOWN");
    if (input.code !== OTP_CODE) throw new UnauthorizedException("OTP_INVALID");

    const existing = this.repository
      ? await this.repository.findUserByContact({
          phone: otp.phone,
          email: otp.email,
        })
      : [...this.users.values()].find(
          (user) => user.phone === otp.phone || user.email === otp.email,
        );
    const isNewUser = !existing;
    const user =
      existing ??
      (await this.createUser({
        channel: otp.channel,
        phone: otp.phone,
        email: otp.email,
        passwordHash: otp.passwordHash,
        consentVersion: otp.consentVersion,
      }));
    this.otpRequests.delete(input.otpId);
    await this.audit(
      "login",
      user.id,
      user.id,
      { channel: user.channel },
      correlationId,
    );
    return this.issueTokens(user, correlationId, { isNewUser });
  }

  async login(
    input: { phone?: string; email?: string; password?: string },
    correlationId: string,
  ) {
    const user = this.repository
      ? await this.repository.findUserByContact({
          phone: input.phone,
          email: input.email,
        })
      : [...this.users.values()].find(
          (candidate) =>
            candidate.phone === input.phone || candidate.email === input.email,
        );
    if (!user) throw new UnauthorizedException("INVALID_CREDENTIALS");
    if (
      user.passwordHash &&
      this.hash(input.password ?? "") !== user.passwordHash
    ) {
      await this.audit(
        "failed_login",
        undefined,
        user.id,
        { channel: user.channel },
        correlationId,
      );
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }
    await this.audit(
      "login",
      user.id,
      user.id,
      { channel: user.channel },
      correlationId,
    );
    return this.issueTokens(user, correlationId);
  }

  async refresh(input: { refreshToken: string }, correlationId: string) {
    const session = this.repository
      ? await this.repository.findSessionByRefreshToken(input.refreshToken)
      : [...this.sessions.values()].find(
          (candidate) =>
            candidate.refreshToken === input.refreshToken &&
            !candidate.revokedAt,
        );
    if (!session) throw new UnauthorizedException("INVALID_REFRESH_TOKEN");
    if (this.repository) await this.repository.revokeSession(session.id);
    else session.revokedAt = new Date().toISOString();
    const user = await this.mustGetUser(session.userId);
    await this.audit("refresh_rotated", user.id, session.id, {}, correlationId);
    return this.issueTokens(user, correlationId);
  }

  async logoutAll(userId: string, correlationId: string) {
    if (this.repository) {
      await this.repository.revokeAllSessions(userId);
    } else {
      for (const session of this.sessions.values()) {
        if (session.userId === userId && !session.revokedAt)
          session.revokedAt = new Date().toISOString();
      }
    }
    await this.audit("logout_all_devices", userId, userId, {}, correlationId);
    return { revoked: true };
  }

  async listSessions(userId: string) {
    if (this.repository) return this.repository.listSessions(userId);
    return [...this.sessions.values()]
      .filter((session) => session.userId === userId)
      .map((session) => ({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        revokedAt: session.revokedAt,
      }));
  }

  async createProfile(
    input: {
      userId: string;
      type: ProfileType;
      displayName: string;
      iinBin?: string;
      address?: string;
      bankAccount?: string;
    },
    correlationId: string,
  ) {
    await this.mustGetUser(input.userId);
    if (!input.displayName)
      throw new BadRequestException("DISPLAY_NAME_REQUIRED");
    if (input.iinBin && !isValidIinBin(input.iinBin))
      throw new BadRequestException("IIN_BIN_INVALID");

    const profile = this.repository
      ? await this.repository.createProfile(input)
      : this.createLocalProfile(input);
    await this.audit(
      "profile_created",
      input.userId,
      profile.id,
      { type: input.type, iinBin: maskIinBin(input.iinBin) },
      correlationId,
    );
    return { ...profile, iinBin: maskIinBin(profile.iinBin) };
  }

  async listProfiles(userId: string) {
    const profiles = this.repository
      ? await this.repository.listProfiles(userId)
      : [...this.profiles.values()].filter(
          (profile) => profile.userId === userId,
        );
    return profiles.map((profile) => ({
      ...profile,
      iinBin: maskIinBin(profile.iinBin),
    }));
  }

  async exportAccount(userId: string, correlationId: string) {
    const user = await this.mustGetUser(userId);
    const profiles = await this.listProfiles(userId);
    const sessions = await this.listSessions(userId);
    await this.audit(
      "account_exported",
      userId,
      userId,
      { profileCount: profiles.length, sessionCount: sessions.length },
      correlationId,
    );
    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        channel: user.channel,
        phone: user.phone,
        email: user.email,
        roles: user.roles,
        consentVersion: user.consentVersion,
        createdAt: user.createdAt,
      },
      profiles,
      sessions,
    };
  }

  async deleteAccount(userId: string, correlationId: string) {
    await this.mustGetUser(userId);
    await this.logoutAll(userId, correlationId);
    await this.audit("account_deleted", userId, userId, {}, correlationId);
    if (this.repository) {
      await this.repository.deleteAccount(userId);
    } else {
      this.users.delete(userId);
      const profileIds = [...this.profiles.values()]
        .filter((profile) => profile.userId === userId)
        .map((profile) => profile.id);
      for (const profileId of profileIds) this.profiles.delete(profileId);
    }
    return { deleted: true };
  }

  async listAuditEvents() {
    if (this.repository) return this.repository.listAuditEvents();
    return this.auditEvents.slice(-100).reverse();
  }

  private async createUser(input: {
    channel: AuthChannel;
    phone?: string;
    email?: string;
    passwordHash?: string;
    consentVersion: string;
  }) {
    if (this.repository) {
      return this.repository.createUser({
        channel: input.channel,
        phone: input.phone,
        email: input.email,
        passwordHash: input.passwordHash,
        roles: ["user"],
        consentVersion: input.consentVersion,
      });
    }
    const user: UserRecord = {
      id: randomUUID(),
      channel: input.channel,
      phone: input.phone,
      email: input.email,
      passwordHash: input.passwordHash,
      roles: ["user"],
      consentVersion: input.consentVersion,
      createdAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    return user;
  }

  private async issueTokens(
    user: UserRecord,
    correlationId: string,
    options: { isNewUser?: boolean } = {},
  ) {
    const session: SessionRecord = {
      id: randomUUID(),
      userId: user.id,
      refreshToken: `stub_refresh_${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    const storedSession = this.repository
      ? await this.repository.createSession(session)
      : session;
    if (!this.repository) this.sessions.set(session.id, session);
    await this.audit(
      "session_created",
      user.id,
      storedSession.id,
      {},
      correlationId,
    );
    const profiles = await this.listProfiles(user.id);
    return {
      accessToken: `stub_access_${user.id}`,
      refreshToken: session.refreshToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        roles: user.roles,
        consentVersion: user.consentVersion,
      },
      isNewUser: options.isNewUser ?? false,
      profileRequired: profiles.length === 0,
    };
  }

  private createLocalProfile(input: {
    userId: string;
    type: ProfileType;
    displayName: string;
    iinBin?: string;
    address?: string;
    bankAccount?: string;
  }) {
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
    return profile;
  }

  private assertChannel(channel: AuthChannel, phone?: string, email?: string) {
    if (channel === "phone" && !/^\+7\d{10}$/.test(phone ?? ""))
      throw new BadRequestException("PHONE_INVALID");
    if (channel === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? ""))
      throw new BadRequestException("EMAIL_INVALID");
  }

  private checkRateLimit(subject: string) {
    const now = Date.now();
    const bucket = this.rateLimits.get(subject);
    if (!bucket || bucket.resetAt < now) {
      this.rateLimits.set(subject, { count: 1, resetAt: now + 60_000 });
      return;
    }
    bucket.count += 1;
    if (bucket.count > 5)
      throw new HttpException("RATE_LIMITED", HttpStatus.TOO_MANY_REQUESTS);
  }

  private async mustGetUser(userId: string) {
    const user = this.repository
      ? await this.repository.findUserById(userId)
      : this.users.get(userId);
    if (!user) throw new UnauthorizedException("USER_NOT_FOUND");
    return user;
  }

  private hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  private async audit(
    action: string,
    actorUserId: string | undefined,
    targetId: string | undefined,
    metadata: AuditEvent["metadata"],
    correlationId: string,
  ) {
    const event = { action, actorUserId, targetId, metadata, correlationId };
    if (this.repository) await this.repository.createAuditEvent(event);
    else
      this.auditEvents.push({
        id: randomUUID(),
        ...event,
        createdAt: new Date().toISOString(),
      });
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
  const checksum = (weights: number[]) =>
    weights.reduce((sum, weight, index) => sum + weight * digits[index], 0) %
    11;
  const first = checksum(firstWeights);
  const control = first === 10 ? checksum(secondWeights) : first;
  return control !== 10 && control === digits[11];
}
