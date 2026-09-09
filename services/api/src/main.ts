import { NestFactory } from '@nestjs/core';
import multipart from '@fastify/multipart';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SafeHttpExceptionFilter } from './common/safe-http-exception.filter';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new SafeHttpExceptionFilter());
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001, process.env.HOST ?? '127.0.0.1');
}

void bootstrap();
