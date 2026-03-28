import '@common/configs/get-config';
import { NestFactory } from '@nestjs/core';
import { KafkaOptions } from '@nestjs/microservices';
import { buildKafkaMicroserviceOptions } from '@common/configs/build-kafka-microservice-options';
import { getConfig } from '@common/configs/get-config';
import { getPrismaClient } from '@database/prisma.singleton';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  process.env.DATABASE_URL = getConfig({
    configKey: 'ORDER_DATABASE_URL',
  });
  const option: KafkaOptions = buildKafkaMicroserviceOptions({
    clientId: 'order-service',
    groupId: 'order-service-consumer',
  });
  const app = await NestFactory.createMicroservice<KafkaOptions>(
    AppModule,
    option,
  );
  app.enableShutdownHooks();
  await app.listen();
  const prisma = getPrismaClient();
  const shutdown = async (): Promise<void> => {
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
  };
  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });
}

void bootstrap();
