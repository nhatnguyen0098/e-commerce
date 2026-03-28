import { NestFactory } from '@nestjs/core';
import { getServicePort } from '@common/configs/get-service-port';
import cookieParser from 'cookie-parser';
import { buildCorsOptions } from './common/configs/build-cors-options';
import { createHelmetMiddleware } from './common/configs/build-helmet-options';
import { TimeoutErrorFilter } from './common/filters/timeout-error.filter';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new TimeoutErrorFilter());
  app.use(cookieParser());
  app.use(createHelmetMiddleware());
  app.enableCors(buildCorsOptions());
  const apiGatewayPort: number = getServicePort({
    configKey: 'API_GATEWAY_PORT',
    defaultValue: 3000,
  });
  await app.listen(apiGatewayPort);
}

void bootstrap();
