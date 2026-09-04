import { BadRequestException, HttpException, UnauthorizedException } from '@nestjs/common';
import { IdentityService, isValidIinBin, maskIinBin } from './identity.service';

describe('IdentityService', () => {
  it('registers with phone, verifies OTP and rotates refresh token', () => {
    const service = new IdentityService();
    const otp = service.register({ channel: 'phone', phone: '+77011234567', consentVersion: 'v1' }, 'test');
    const auth = service.verifyOtp({ otpId: otp.otpId, code: '111111' }, 'test');
    const refreshed = service.refresh({ refreshToken: auth.refreshToken }, 'test');

    expect(auth.user.roles).toEqual(['user']);
    expect(refreshed.refreshToken).not.toEqual(auth.refreshToken);
  });

  it('rejects invalid OTP and invalid IIN/BIN', () => {
    const service = new IdentityService();
    const otp = service.register({ channel: 'email', email: 'user@example.com', consentVersion: 'v1' }, 'test');

    expect(() => service.verifyOtp({ otpId: otp.otpId, code: '000000' }, 'test')).toThrow(UnauthorizedException);
    expect(() => service.createProfile({ userId: 'missing', type: 'person', displayName: 'Test', iinBin: '123' }, 'test')).toThrow();
    expect(isValidIinBin('123')).toBe(false);
  });

  it('masks IIN/BIN in returned profiles and audit metadata', () => {
    const service = new IdentityService();
    const otp = service.register({ channel: 'phone', phone: '+77011234568', consentVersion: 'v1' }, 'test');
    const auth = service.verifyOtp({ otpId: otp.otpId, code: '111111' }, 'test');
    const profile = service.createProfile({ userId: auth.user.id, type: 'person', displayName: 'Test', iinBin: '000000000000' }, 'test');

    expect(profile.iinBin).toBe(maskIinBin('000000000000'));
    expect(service.listAuditEvents().some((event) => JSON.stringify(event).includes('000000000000'))).toBe(false);
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
});
