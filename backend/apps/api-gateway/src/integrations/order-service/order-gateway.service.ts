import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { connectKafkaClientWithRetry } from '@common/utils/connect-kafka-client-with-retry';
import { requestKafkaRpc } from '@common/utils/request-kafka-rpc';
import {
  ORDERS_MESSAGE_PATTERN,
  type CreateOrderCheckoutBody,
  type CreateOrderCheckoutRpcRequest,
  type GetMyOrderRpcRequest,
  type ListMyOrdersRpcRequest,
  type OrderCheckoutResponseDto,
  type OrderDetailDto,
  type OrderSummaryDto,
} from '@contracts/orders/orders.contracts';

@Injectable()
export class OrderGatewayService implements OnModuleInit {
  constructor(
    @Inject('ORDER_SERVICE_CLIENT')
    private readonly orderServiceClient: ClientKafka,
  ) {}
  public async onModuleInit(): Promise<void> {
    this.orderServiceClient.subscribeToResponseOf(ORDERS_MESSAGE_PATTERN.adminTest);
    this.orderServiceClient.subscribeToResponseOf(ORDERS_MESSAGE_PATTERN.checkout);
    this.orderServiceClient.subscribeToResponseOf(ORDERS_MESSAGE_PATTERN.listMine);
    this.orderServiceClient.subscribeToResponseOf(
      ORDERS_MESSAGE_PATTERN.getMineById,
    );
    await connectKafkaClientWithRetry({ client: this.orderServiceClient });
  }
  public adminTest(): Promise<{ readonly ok: boolean }> {
    return requestKafkaRpc<{ readonly ok: boolean }, Record<string, never>>({
      client: this.orderServiceClient,
      pattern: ORDERS_MESSAGE_PATTERN.adminTest,
      payload: {},
    });
  }
  public createCheckout(
    accessToken: string,
    body: CreateOrderCheckoutBody,
  ): Promise<OrderCheckoutResponseDto> {
    const payload: CreateOrderCheckoutRpcRequest = { accessToken, body };
    return requestKafkaRpc<OrderCheckoutResponseDto, CreateOrderCheckoutRpcRequest>(
      {
        client: this.orderServiceClient,
        pattern: ORDERS_MESSAGE_PATTERN.checkout,
        payload,
        timeoutMs: 20000,
      },
    );
  }
  public listMyOrders(accessToken: string): Promise<OrderSummaryDto[]> {
    const payload: ListMyOrdersRpcRequest = { accessToken };
    return requestKafkaRpc<OrderSummaryDto[], ListMyOrdersRpcRequest>({
      client: this.orderServiceClient,
      pattern: ORDERS_MESSAGE_PATTERN.listMine,
      payload,
      timeoutMs: 10000,
    });
  }
  public getMyOrderById(
    accessToken: string,
    orderId: string,
  ): Promise<OrderDetailDto> {
    const payload: GetMyOrderRpcRequest = { accessToken, orderId };
    return requestKafkaRpc<OrderDetailDto, GetMyOrderRpcRequest>({
      client: this.orderServiceClient,
      pattern: ORDERS_MESSAGE_PATTERN.getMineById,
      payload,
      timeoutMs: 10000,
    });
  }
}
