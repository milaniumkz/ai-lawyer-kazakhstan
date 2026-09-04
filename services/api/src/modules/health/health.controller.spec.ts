import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns KZ service health', () => {
    expect(new HealthController().health()).toEqual({
      status: 'ok',
      service: 'api',
      jurisdiction: 'KZ',
    });
  });
});
