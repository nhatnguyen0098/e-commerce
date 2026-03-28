import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildKafkaMicroserviceOptions } from '@common/configs/build-kafka-microservice-options';
import { UserGatewayService } from './user-gateway.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE_CLIENT',
        transport: Transport.KAFKA,
        options: buildKafkaMicroserviceOptions({
          clientId: 'api-gateway-user-client',
          groupId: 'api-gateway-user-client-consumer',
        }).options,
      },
    ]),
  ],
  providers: [UserGatewayService],
  exports: [UserGatewayService],
})
export class UserServiceClientModule {}
