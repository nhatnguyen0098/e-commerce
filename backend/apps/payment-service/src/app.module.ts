import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RpcAuthGuard } from '@common/guards/rpc-auth.guard';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
import { CodPaymentMethodStrategy } from './strategies/cod-payment-method.strategy';
import { ManualPaymentMethodStrategy } from './strategies/manual-payment-method.strategy';
import { PaymentMethodStrategyFactory } from './strategies/payment-method-strategy.factory';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentRepository,
    CodPaymentMethodStrategy,
    ManualPaymentMethodStrategy,
    PaymentMethodStrategyFactory,
    {
      provide: APP_GUARD,
      useClass: RpcAuthGuard,
    },
  ],
})
export class AppModule {}
