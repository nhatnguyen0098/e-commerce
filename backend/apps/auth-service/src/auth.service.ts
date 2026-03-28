import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { connectKafkaClientWithRetry } from '@common/utils/connect-kafka-client-with-retry';
import { mapRpcErrorByRules } from '@common/utils/map-rpc-error-by-rules';
import { requestKafkaRpc } from '@common/utils/request-kafka-rpc';
import type {
  AuthAccessTokenClaims,
  AuthLoginRequest,
  AuthLogoutRequest,
  AuthLogoutResponse,
  AuthRegisterRequest,
  AuthTokenResponse,
  AuthUserResponse,
} from '@contracts/auth/auth.contracts';
import {
  USER_MESSAGE_PATTERN,
  type CreateUserRequest,
  type GetUserByPhoneRequest,
  type GetUserByPhoneResponse,
  type UserResponse,
} from '@contracts/users/users.contracts';
import type { AuthUserRecord } from './models/auth-user-record.type';

const USER_CREATE_CONFLICT_MESSAGES: readonly string[] = [
  'User already exists',
  'Phone or email already in use',
  'Phone already in use',
  'Email already in use',
] as const;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly revokedTokenIds: Set<string> = new Set();
  private readonly passwordSaltRounds: number = 10;

  constructor(
    private readonly jwtService: JwtService,
    @Inject('USER_SERVICE_CLIENT')
    private readonly userServiceClient: ClientKafka,
  ) {}
  public async onModuleInit(): Promise<void> {
    this.userServiceClient.subscribeToResponseOf(
      USER_MESSAGE_PATTERN.createUser,
    );
    this.userServiceClient.subscribeToResponseOf(
      USER_MESSAGE_PATTERN.getUserByPhone,
    );
    await connectKafkaClientWithRetry({ client: this.userServiceClient });
  }

  /**
   * Register via user-service persistence, then issue access token.
   */
  public async registerUser(
    requestBody: AuthRegisterRequest,
  ): Promise<AuthTokenResponse> {
    const normalizedPhone: string = this.normalizePhone(requestBody.phone);
    if (normalizedPhone.length < 8) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid phone number',
      });
    }
    const passwordHash: string = await hash(
      requestBody.password,
      this.passwordSaltRounds,
    );
    const optionalEmail: string | undefined =
      requestBody.email !== undefined &&
      requestBody.email !== null &&
      requestBody.email.trim().length > 0
        ? this.normalizeEmail(requestBody.email)
        : undefined;
    const createPayload: CreateUserRequest = {
      phone: normalizedPhone,
      fullName: requestBody.fullName.trim(),
      passwordHash,
      ...(optionalEmail !== undefined ? { email: optionalEmail } : {}),
    };
    const createdUser: UserResponse =
      await this.createUserViaUserService(createPayload);
    const userRecord: AuthUserRecord = {
      id: createdUser.id,
      phone: createdUser.phone,
      email: createdUser.email ?? '',
      fullName: createdUser.fullName,
      passwordHash,
    };
    return this.createTokenResponse(userRecord);
  }

  /**
   * Authenticate using credentials loaded from user-service.
   */
  public async loginUser(
    requestBody: AuthLoginRequest,
  ): Promise<AuthTokenResponse> {
    const normalizedPhone: string = this.normalizePhone(requestBody.phone);
    if (normalizedPhone.length === 0) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid phone or password',
      });
    }
    const lookupPayload: GetUserByPhoneRequest = { phone: normalizedPhone };
    const lookup: GetUserByPhoneResponse = await requestKafkaRpc<
      GetUserByPhoneResponse,
      GetUserByPhoneRequest
    >({
      client: this.userServiceClient,
      pattern: USER_MESSAGE_PATTERN.getUserByPhone,
      payload: lookupPayload,
    });
    if (!lookup.found || !lookup.user) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid phone or password',
      });
    }
    const isPasswordMatched: boolean = await compare(
      requestBody.password,
      lookup.user.passwordHash,
    );
    if (!isPasswordMatched) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid phone or password',
      });
    }
    const userRecord: AuthUserRecord = {
      id: lookup.user.id,
      phone: lookup.user.phone,
      email: lookup.user.email,
      fullName: lookup.user.fullName,
      passwordHash: lookup.user.passwordHash,
    };
    return this.createTokenResponse(userRecord);
  }

  /**
   * Revoke a valid access token.
   */
  public logoutUser(requestBody: AuthLogoutRequest): AuthLogoutResponse {
    try {
      const decodedPayload: AuthAccessTokenClaims =
        this.jwtService.verify<AuthAccessTokenClaims>(requestBody.accessToken);
      this.revokedTokenIds.add(decodedPayload.jti);
      return {
        isSuccess: true,
      };
    } catch {
      return {
        isSuccess: false,
      };
    }
  }

  private createTokenResponse(userRecord: AuthUserRecord): AuthTokenResponse {
    const tokenId: string = randomUUID();
    const jwtPayload: AuthAccessTokenClaims = {
      sub: userRecord.id,
      phone: userRecord.phone,
      email: userRecord.email.length > 0 ? userRecord.email : '',
      fullName: userRecord.fullName,
      jti: tokenId,
    };
    const accessToken: string = this.jwtService.sign(jwtPayload);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: getJwtExpiresIn(),
      user: this.toUserResponse(userRecord),
    };
  }

  private toUserResponse(userRecord: AuthUserRecord): AuthUserResponse {
    return {
      id: userRecord.id,
      phone: userRecord.phone,
      email: userRecord.email.length > 0 ? userRecord.email : null,
      fullName: userRecord.fullName,
    };
  }

  private normalizePhone(phone: string): string {
    return phone.trim().replace(/\s+/g, '');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async createUserViaUserService(
    createPayload: CreateUserRequest,
  ): Promise<UserResponse> {
    try {
      return await requestKafkaRpc<UserResponse, CreateUserRequest>({
        client: this.userServiceClient,
        pattern: USER_MESSAGE_PATTERN.createUser,
        payload: createPayload,
      });
    } catch (error: unknown) {
      const conflictException: RpcException | null = mapRpcErrorByRules({
        error,
        rules: [
          {
            when: {
              status: HttpStatus.CONFLICT,
            },
            mapTo: {
              status: HttpStatus.CONFLICT,
              messageFromSource: true,
              fallbackMessage: 'User already exists',
            },
          },
          {
            when: {
              status: 'error',
              messageIn: ['User already exists'],
            },
            mapTo: {
              status: HttpStatus.CONFLICT,
              fallbackMessage: 'User already exists',
            },
          },
          {
            when: {
              messageIn: USER_CREATE_CONFLICT_MESSAGES,
            },
            mapTo: {
              status: HttpStatus.CONFLICT,
              messageFromSource: true,
              fallbackMessage: 'User already exists',
            },
          },
        ],
      });
      if (conflictException) {
        throw conflictException;
      }
      throw error;
    }
  }
}

function getJwtExpiresIn(): string {
  const defaultValue: string = '1h';
  const configuredValue: string | undefined = process.env.AUTH_JWT_EXPIRES_IN;
  if (configuredValue && configuredValue.trim().length > 0) {
    return configuredValue;
  }
  return defaultValue;
}
