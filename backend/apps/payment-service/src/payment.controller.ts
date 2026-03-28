import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcPublic } from '@common/decorators/rpc-public.decorator';
import { unwrapKafkaMessageEnvelope } from '@common/utils/kafka-message-envelope';
import {
  PAYMENTS_MESSAGE_PATTERN,
  type CreatePaymentForOrderRequest,
  type ListPaymentsByOrderIdRequest,
  type ListPaymentsByOrderIdResponse,
  type PaymentForOrderDto,
} from '@contracts/payments/payments.contracts';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @RpcPublic()
  @MessagePattern(PAYMENTS_MESSAGE_PATTERN.createForOrder)
  public createPaymentForOrder(
    @Payload()
    payload:
      | CreatePaymentForOrderRequest
      | { readonly key: string; readonly value: CreatePaymentForOrderRequest },
  ): Promise<PaymentForOrderDto> {
    const resolvedPayload: CreatePaymentForOrderRequest =
      unwrapKafkaMessageEnvelope<CreatePaymentForOrderRequest>(payload);
    return this.paymentService.createPaymentForOrder(resolvedPayload);
  }

  @RpcPublic()
  @MessagePattern(PAYMENTS_MESSAGE_PATTERN.listByOrderId)
  public listPaymentsByOrderId(
    @Payload()
    payload:
      | ListPaymentsByOrderIdRequest
      | { readonly key: string; readonly value: ListPaymentsByOrderIdRequest },
  ): Promise<ListPaymentsByOrderIdResponse> {
    const resolvedPayload: ListPaymentsByOrderIdRequest =
      unwrapKafkaMessageEnvelope<ListPaymentsByOrderIdRequest>(payload);
    return this.paymentService.listPaymentsByOrderId(resolvedPayload.orderId);
  }
}
