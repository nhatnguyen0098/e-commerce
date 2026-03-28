import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PaymentProvider } from '@prisma-payment/client';
import { CodPaymentMethodStrategy } from './cod-payment-method.strategy';
import { ManualPaymentMethodStrategy } from './manual-payment-method.strategy';
import { PaymentMethodStrategy } from './payment-method-strategy.interface';

@Injectable()
export class PaymentMethodStrategyFactory {
  private readonly strategies: readonly PaymentMethodStrategy[];

  public constructor(
    codStrategy: CodPaymentMethodStrategy,
    manualStrategy: ManualPaymentMethodStrategy,
  ) {
    this.strategies = [codStrategy, manualStrategy];
  }
  public resolve(provider: PaymentProvider): PaymentMethodStrategy {
    const matched: PaymentMethodStrategy | undefined = this.strategies.find(
      (strategy: PaymentMethodStrategy): boolean => strategy.supports(provider),
    );
    if (matched !== undefined) {
      return matched;
    }
    throw new RpcException('Unsupported payment provider');
  }
}
