import { BadRequestException } from '@nestjs/common';
import { buildErrorEnvelope } from './safe-http-exception.filter';

describe('buildErrorEnvelope', () => {
  it('wraps errors with correlation id and masks sensitive details', () => {
    const envelope = buildErrorEnvelope(
      new BadRequestException({ code: 'IIN_BIN_INVALID', iinBin: '000000000000', message: 'bad' }),
      'corr-1',
    );

    expect(envelope.error.correlationId).toBe('corr-1');
    expect(envelope.error.details.iinBin).toBe('[masked]');
  });
});
