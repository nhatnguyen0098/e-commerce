import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildKafkaMicroserviceOptions } from '@common/configs/build-kafka-microservice-options';
import { OrderGatewayService } from './order-gateway.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE_CLIENT',
        transport: Transport.KAFKA,
        options: buildKafkaMicroserviceOptions({
          clientId: 'api-gateway-order-client',
          groupId: 'api-gateway-order-client-consumer',
        }).options,
      },
    ]),
  ],
  providers: [OrderGatewayService],
  exports: [OrderGatewayService],
})
export class OrderServiceClientModule {}
