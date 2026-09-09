import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

interface HttpLikeResponse {
  status(code: number): { json?: (body: unknown) => void; send?: (body: unknown) => void };
}

interface HttpLikeRequest {
  headers: Record<string, string | string[] | undefined>;
}

@Catch()
export class SafeHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpLikeRequest>();
    const response = http.getResponse<HttpLikeResponse>();
    const correlationId = getCorrelationId(request.headers);
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const sender = response.status(status);
    const body = buildErrorEnvelope(exception, correlationId);
    if (sender.json) {
      sender.json(body);
      return;
    }
    sender.send?.(body);
  }
}

export function buildErrorEnvelope(exception: unknown, correlationId: string) {
  const safe = exception instanceof HttpException ? normalizeHttpException(exception) : { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервиса' };
  return {
    error: {
      code: safe.code,
      message: safe.message,
      details: maskSensitiveDetails(safe.details ?? {}),
      correlationId,
    },
  };
}

function normalizeHttpException(exception: HttpException) {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return { code: response, message: response };
  }
  if (typeof response === 'object' && response !== null) {
    const value = response as Record<string, unknown>;
    return {
      code: String(value.code ?? value.error ?? exception.name),
      message: String(value.message ?? 'Ошибка запроса'),
      details: value,
    };
  }
  return { code: exception.name, message: 'Ошибка запроса' };
}

function getCorrelationId(headers: HttpLikeRequest['headers']) {
  const value = headers['x-correlation-id'];
  if (Array.isArray(value)) return value[0] ?? 'missing-correlation-id';
  return value ?? 'missing-correlation-id';
}

function maskSensitiveDetails(details: Record<string, unknown>) {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    masked[key] = /(password|token|secret|iin|bin|phone|email)/i.test(key) ? '[masked]' : value;
  }
  return masked;
}
