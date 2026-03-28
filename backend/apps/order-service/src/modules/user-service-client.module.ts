import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildKafkaMicroserviceOptions } from '@common/configs/build-kafka-microservice-options';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE_CLIENT',
        transport: Transport.KAFKA,
        options: buildKafkaMicroserviceOptions({
          clientId: 'order-service-user-client',
          groupId: 'order-service-user-client-consumer',
        }).options,
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class UserServiceClientModule {}
