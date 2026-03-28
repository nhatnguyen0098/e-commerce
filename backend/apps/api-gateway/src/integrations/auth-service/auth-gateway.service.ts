import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { connectKafkaClientWithRetry } from '@common/utils/connect-kafka-client-with-retry';
import { requestKafkaRpc } from '@common/utils/request-kafka-rpc';
import { rethrowAuthMicroserviceError } from './rethrow-auth-microservice-error';
import {
  AUTH_MESSAGE_PATTERN,
  type AuthLoginRequest,
  type AuthLogoutRequest,
  type AuthLogoutResponse,
  type AuthRegisterRequest,
  type AuthTokenResponse,
} from '@contracts/auth/auth.contracts';

@Injectable()
export class AuthGatewayService implements OnModuleInit {
  constructor(
    @Inject('AUTH_SERVICE_CLIENT')
    private readonly authServiceClient: ClientKafka,
  ) {}
  public async onModuleInit(): Promise<void> {
    this.authServiceClient.subscribeToResponseOf(AUTH_MESSAGE_PATTERN.register);
    this.authServiceClient.subscribeToResponseOf(AUTH_MESSAGE_PATTERN.login);
    this.authServiceClient.subscribeToResponseOf(AUTH_MESSAGE_PATTERN.logout);
    await connectKafkaClientWithRetry({ client: this.authServiceClient });
  }

  /**
   * Send register request to auth-service.
   */
  public async registerUser(
    requestBody: AuthRegisterRequest,
  ): Promise<AuthTokenResponse> {
    try {
      return await requestKafkaRpc<AuthTokenResponse, AuthRegisterRequest>({
        client: this.authServiceClient,
        pattern: AUTH_MESSAGE_PATTERN.register,
        payload: requestBody,
      });
    } catch (error: unknown) {
      rethrowAuthMicroserviceError(error);
    }
  }

  /**
   * Send login request to auth-service.
   */
  public async loginUser(
    requestBody: AuthLoginRequest,
  ): Promise<AuthTokenResponse> {
    try {
      return await requestKafkaRpc<AuthTokenResponse, AuthLoginRequest>({
        client: this.authServiceClient,
        pattern: AUTH_MESSAGE_PATTERN.login,
        payload: requestBody,
      });
    } catch (error: unknown) {
      rethrowAuthMicroserviceError(error);
    }
  }

  /**
   * Send logout request to auth-service.
   */
  public async logoutUser(
    requestBody: AuthLogoutRequest,
  ): Promise<AuthLogoutResponse> {
    try {
      return await requestKafkaRpc<AuthLogoutResponse, AuthLogoutRequest>({
        client: this.authServiceClient,
        pattern: AUTH_MESSAGE_PATTERN.logout,
        payload: requestBody,
      });
    } catch (error: unknown) {
      rethrowAuthMicroserviceError(error);
    }
  }
}
