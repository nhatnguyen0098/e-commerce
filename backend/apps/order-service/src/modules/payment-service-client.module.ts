import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildKafkaMicroserviceOptions } from '@common/configs/build-kafka-microservice-options';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PAYMENT_SERVICE_CLIENT',
        transport: Transport.KAFKA,
        options: buildKafkaMicroserviceOptions({
          clientId: 'order-service-payment-client',
          groupId: 'order-service-payment-client-consumer',
        }).options,
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class PaymentServiceClientModule {}
