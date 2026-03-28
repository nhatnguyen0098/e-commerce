import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcPublic } from '@common/decorators/rpc-public.decorator';
import {
  ORDERS_MESSAGE_PATTERN,
  type CreateOrderCheckoutRpcRequest,
  type GetMyOrderRpcRequest,
  type ListMyOrdersRpcRequest,
  type OrderCheckoutResponseDto,
  type OrderDetailDto,
  type OrderSummaryDto,
} from '@contracts/orders/orders.contracts';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @RpcPublic()
  @MessagePattern(ORDERS_MESSAGE_PATTERN.adminTest)
  public adminTest(): { readonly ok: boolean } {
    return { ok: true };
  }

  @MessagePattern(ORDERS_MESSAGE_PATTERN.checkout)
  public createCheckout(
    @Payload() payload: CreateOrderCheckoutRpcRequest,
  ): Promise<OrderCheckoutResponseDto> {
    return this.orderService.createCheckout(payload);
  }

  @MessagePattern(ORDERS_MESSAGE_PATTERN.listMine)
  public listMyOrders(
    @Payload() payload: ListMyOrdersRpcRequest,
  ): Promise<OrderSummaryDto[]> {
    return this.orderService.listMyOrders(payload);
  }

  @MessagePattern(ORDERS_MESSAGE_PATTERN.getMineById)
  public getMyOrder(
    @Payload() payload: GetMyOrderRpcRequest,
  ): Promise<OrderDetailDto> {
    return this.orderService.getMyOrderById(payload);
  }
}
