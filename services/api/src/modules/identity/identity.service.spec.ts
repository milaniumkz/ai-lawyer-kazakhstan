import { BadRequestException, HttpException, UnauthorizedException } from '@nestjs/common';
import { IdentityService, isValidIinBin, maskIinBin } from './identity.service';
import { IdentityRepository } from './repositories/identity.repository';

describe('IdentityService', () => {
  it('registers with phone, verifies OTP and rotates refresh token', async () => {
    const service = new IdentityService();
    const otp = service.register({ channel: 'phone', phone: '+77011234567', consentVersion: 'v1' }, 'test');
    const auth = await service.verifyOtp({ otpId: otp.otpId, code: '111111' }, 'test');
    const refreshed = await service.refresh({ refreshToken: auth.refreshToken }, 'test');

    expect(auth.user.roles).toEqual(['user']);
    expect(refreshed.refreshToken).not.toEqual(auth.refreshToken);
  });

  it('rejects invalid OTP and invalid IIN/BIN', async () => {
    const service = new IdentityService();
    const otp = service.register({ channel: 'email', email: 'user@example.com', consentVersion: 'v1' }, 'test');

    await expect(service.verifyOtp({ otpId: otp.otpId, code: '000000' }, 'test')).rejects.toThrow(UnauthorizedException);
    await expect(service.createProfile({ userId: 'missing', type: 'person', displayName: 'Test', iinBin: '123' }, 'test')).rejects.toThrow();
    expect(isValidIinBin('123')).toBe(false);
  });

  it('masks IIN/BIN in returned profiles and audit metadata', async () => {
    const service = new IdentityService();
    const otp = service.register({ channel: 'phone', phone: '+77011234568', consentVersion: 'v1' }, 'test');
    const auth = await service.verifyOtp({ otpId: otp.otpId, code: '111111' }, 'test');
    const profile = await service.createProfile({ userId: auth.user.id, type: 'person', displayName: 'Test', iinBin: '000000000000' }, 'test');

    expect(profile.iinBin).toBe(maskIinBin('000000000000'));
    expect((await service.listAuditEvents()).some((event) => JSON.stringify(event).includes('000000000000'))).toBe(false);
  });

  it('rate limits OTP requests', () => {
    const service = new IdentityService();
    for (let index = 0; index < 5; index += 1) {
      service.register({ channel: 'phone', phone: '+77011234569', consentVersion: 'v1' }, 'test');
    }
    expect(() => service.register({ channel: 'phone', phone: '+77011234569', consentVersion: 'v1' }, 'test')).toThrow(HttpException);
  });

  it('requires consent and a valid contact channel', () => {
    const service = new IdentityService();
    expect(() => service.register({ channel: 'phone', phone: '87011234567', consentVersion: 'v1' }, 'test')).toThrow(BadRequestException);
    expect(() => service.register({ channel: 'email', email: 'bad', consentVersion: '' }, 'test')).toThrow(BadRequestException);
  });

  it('uses configured repository for persistent identity flow', async () => {
    const repository = createRepositoryMock();
    const service = new IdentityService(repository);
    const otp = service.register({ channel: 'email', email: 'repo@example.com', consentVersion: 'v1' }, 'test');

    const auth = await service.verifyOtp({ otpId: otp.otpId, code: '111111' }, 'test');
    await service.refresh({ refreshToken: auth.refreshToken }, 'test');

    expect(repository.findUserByContact).toHaveBeenCalledWith({ phone: undefined, email: 'repo@example.com' });
    expect(repository.createUser).toHaveBeenCalled();
    expect(repository.createSession).toHaveBeenCalledTimes(2);
    expect(repository.revokeSession).toHaveBeenCalledWith('session-1');
    expect(repository.createAuditEvent).toHaveBeenCalled();
  });
});

function createRepositoryMock(): jest.Mocked<IdentityRepository> {
  const user = {
    id: 'user-1',
    channel: 'email' as const,
    email: 'repo@example.com',
    roles: ['user' as const],
    consentVersion: 'v1',
    createdAt: '2026-09-04T00:00:00.000Z',
  };
  return {
    findUserByContact: jest.fn().mockResolvedValueOnce(undefined).mockResolvedValue(user),
    findUserById: jest.fn().mockResolvedValue(user),
    createUser: jest.fn().mockResolvedValue(user),
    createSession: jest
      .fn()
      .mockResolvedValueOnce({ id: 'session-1', userId: 'user-1', refreshToken: 'refresh-1', createdAt: '2026-09-04T00:00:00.000Z' })
      .mockResolvedValueOnce({ id: 'session-2', userId: 'user-1', refreshToken: 'refresh-2', createdAt: '2026-09-04T00:00:00.000Z' }),
    findSessionByRefreshToken: jest.fn().mockResolvedValue({ id: 'session-1', userId: 'user-1', refreshToken: 'refresh-1', createdAt: '2026-09-04T00:00:00.000Z' }),
    revokeSession: jest.fn().mockResolvedValue(undefined),
    revokeAllSessions: jest.fn().mockResolvedValue(undefined),
    listSessions: jest.fn().mockResolvedValue([]),
    createProfile: jest.fn(),
    listProfiles: jest.fn().mockResolvedValue([]),
    createAuditEvent: jest.fn().mockResolvedValue({
      id: 'audit-1',
      action: 'login',
      metadata: {},
      correlationId: 'test',
      createdAt: '2026-09-04T00:00:00.000Z',
    }),
    listAuditEvents: jest.fn().mockResolvedValue([]),
  };
}
