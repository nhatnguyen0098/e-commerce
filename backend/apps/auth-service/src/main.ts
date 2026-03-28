import '@common/configs/get-config';
import { NestFactory } from '@nestjs/core';
import { KafkaOptions } from '@nestjs/microservices';
import { buildKafkaMicroserviceOptions } from '@common/configs/build-kafka-microservice-options';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const option: KafkaOptions = buildKafkaMicroserviceOptions({
    clientId: 'auth-service',
    groupId: 'auth-service-consumer',
  });
  const app = await NestFactory.createMicroservice<KafkaOptions>(
    AppModule,
    option,
  );
  await app.listen();
}

void bootstrap();
