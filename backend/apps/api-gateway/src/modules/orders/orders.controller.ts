import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { AuthUserResponse } from '@contracts/auth/auth.contracts';
import type {
  CreateOrderCheckoutBody,
  OrderCheckoutResponseDto,
  OrderDetailDto,
  OrderSummaryDto,
} from '@contracts/orders/orders.contracts';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AccessToken } from '../../common/decorators/access-token.decorator';
import { OrderGatewayService } from '../../integrations/order-service/order-gateway.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderGatewayService: OrderGatewayService) {}

  @Public()
  @Get('admin/test')
  public adminTest(): Promise<{ readonly ok: boolean }> {
    return this.orderGatewayService.adminTest();
  }

  @Post('checkout')
  public createCheckout(
    @AuthUser() _authUser: AuthUserResponse,
    @AccessToken() accessToken: string,
    @Body() body: CreateOrderCheckoutBody,
  ): Promise<OrderCheckoutResponseDto> {
    return this.orderGatewayService.createCheckout(accessToken, body);
  }

  @Get('mine')
  public listMyOrders(
    @AuthUser() _authUser: AuthUserResponse,
    @AccessToken() accessToken: string,
  ): Promise<OrderSummaryDto[]> {
    return this.orderGatewayService.listMyOrders(accessToken);
  }

  @Get('mine/:orderId')
  public getMyOrder(
    @AuthUser() _authUser: AuthUserResponse,
    @AccessToken() accessToken: string,
    @Param('orderId') orderId: string,
  ): Promise<OrderDetailDto> {
    return this.orderGatewayService.getMyOrderById(accessToken, orderId);
  }
}
