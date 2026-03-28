import { Module } from '@nestjs/common';
import { OrderServiceClientModule } from '../../integrations/order-service/order-service-client.module';
import { OrdersController } from './orders.controller';

@Module({
  imports: [OrderServiceClientModule],
  controllers: [OrdersController],
})
export class OrdersModule {}
