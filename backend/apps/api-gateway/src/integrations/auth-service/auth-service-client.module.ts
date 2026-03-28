import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildKafkaMicroserviceOptions } from '@common/configs/build-kafka-microservice-options';
import { AuthGatewayService } from './auth-gateway.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE_CLIENT',
        transport: Transport.KAFKA,
        options: buildKafkaMicroserviceOptions({
          clientId: 'api-gateway-auth-client',
          groupId: 'api-gateway-auth-client-consumer',
        }).options,
      },
    ]),
  ],
  providers: [AuthGatewayService],
  exports: [AuthGatewayService],
})
export class AuthServiceClientModule {}
