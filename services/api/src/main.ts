import { NestFactory } from '@nestjs/core';
import { SafeHttpExceptionFilter } from './common/safe-http-exception.filter';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new SafeHttpExceptionFilter());
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001, process.env.HOST ?? '127.0.0.1');
}

void bootstrap();
