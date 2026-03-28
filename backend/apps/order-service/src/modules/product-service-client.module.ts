import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildKafkaMicroserviceOptions } from '@common/configs/build-kafka-microservice-options';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE_CLIENT',
        transport: Transport.KAFKA,
        options: buildKafkaMicroserviceOptions({
          clientId: 'order-service-product-client',
          groupId: 'order-service-product-client-consumer',
        }).options,
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class ProductServiceClientModule {}
