import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { connectKafkaClientWithRetry } from '@common/utils/connect-kafka-client-with-retry';
import { requestKafkaRpc } from '@common/utils/request-kafka-rpc';
import type {
  GetUserByIdRequest,
  UpdateUserRequest,
  UserResponse,
} from '@contracts/users/users.contracts';
import { USER_MESSAGE_PATTERN } from '@contracts/users/users.contracts';

@Injectable()
export class UserGatewayService implements OnModuleInit {
  constructor(
    @Inject('USER_SERVICE_CLIENT')
    private readonly userServiceClient: ClientKafka,
  ) {}
  public async onModuleInit(): Promise<void> {
    this.userServiceClient.subscribeToResponseOf(
      USER_MESSAGE_PATTERN.getUserById,
    );
    this.userServiceClient.subscribeToResponseOf(
      USER_MESSAGE_PATTERN.updateUser,
    );
    await connectKafkaClientWithRetry({ client: this.userServiceClient });
  }

  /**
   * Request user data from user-service.
   */
  public async getUserById(
    requestBody: GetUserByIdRequest,
  ): Promise<UserResponse> {
    return requestKafkaRpc<UserResponse, GetUserByIdRequest>({
      client: this.userServiceClient,
      pattern: USER_MESSAGE_PATTERN.getUserById,
      payload: requestBody,
    });
  }

  /**
   * Update user profile via user-service.
   */
  public async updateUser(
    requestBody: UpdateUserRequest,
  ): Promise<UserResponse> {
    return requestKafkaRpc<UserResponse, UpdateUserRequest>({
      client: this.userServiceClient,
      pattern: USER_MESSAGE_PATTERN.updateUser,
      payload: requestBody,
    });
  }
}
