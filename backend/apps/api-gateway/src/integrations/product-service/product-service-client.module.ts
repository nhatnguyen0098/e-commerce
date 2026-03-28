import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildKafkaMicroserviceOptions } from '@common/configs/build-kafka-microservice-options';
import { CatalogGatewayService } from './catalog-gateway.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE_CLIENT',
        transport: Transport.KAFKA,
        options: buildKafkaMicroserviceOptions({
          clientId: 'api-gateway-product-client',
          groupId: 'api-gateway-product-client-consumer',
        }).options,
      },
    ]),
  ],
  providers: [CatalogGatewayService],
  exports: [CatalogGatewayService],
})
export class ProductServiceClientModule {}
