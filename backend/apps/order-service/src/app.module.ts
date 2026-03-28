import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RpcAuthGuard } from '@common/guards/rpc-auth.guard';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { PaymentServiceClientModule } from './modules/payment-service-client.module';
import { ProductServiceClientModule } from './modules/product-service-client.module';
import { OrderService } from './order.service';
import { UserServiceClientModule } from './modules/user-service-client.module';

@Module({
  imports: [
    UserServiceClientModule,
    ProductServiceClientModule,
    PaymentServiceClientModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    {
      provide: APP_GUARD,
      useClass: RpcAuthGuard,
    },
  ],
})
export class AppModule {}
