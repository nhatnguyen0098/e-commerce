import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcPublic } from '@common/decorators/rpc-public.decorator';
import { unwrapKafkaMessageEnvelope } from '@common/utils/kafka-message-envelope';
import {
  USER_MESSAGE_PATTERN,
  type CreateUserRequest,
  type UserCheckExistsRequest,
  type UserCheckExistsResponse,
  type GetUserByEmailRequest,
  type GetUserByEmailResponse,
  type GetUserByIdRequest,
  type GetUserByPhoneRequest,
  type GetUserByPhoneResponse,
  type UpdateUserRequest,
  type UserResponse,
} from '@contracts/users/users.contracts';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RpcPublic()
  @MessagePattern(USER_MESSAGE_PATTERN.checkExists)
  public async checkUserExists(
    @Payload()
    payload:
      | UserCheckExistsRequest
      | { readonly key: string; readonly value: UserCheckExistsRequest },
  ): Promise<UserCheckExistsResponse> {
    const resolvedPayload: UserCheckExistsRequest =
      unwrapKafkaMessageEnvelope<UserCheckExistsRequest>(payload);
    const exists: boolean = await this.userService.checkUserExists(
      resolvedPayload.userId,
    );
    return { exists };
  }

  @MessagePattern(USER_MESSAGE_PATTERN.getUserById)
  public async getUserById(
    @Payload() payload: GetUserByIdRequest,
  ): Promise<UserResponse> {
    return this.userService.getUserById(payload.userId);
  }

  @RpcPublic()
  @MessagePattern(USER_MESSAGE_PATTERN.createUser)
  public async createUser(
    @Payload() payload: CreateUserRequest,
  ): Promise<UserResponse> {
    return this.userService.createUser(payload);
  }

  @RpcPublic()
  @MessagePattern(USER_MESSAGE_PATTERN.getUserByEmail)
  public async getUserByEmail(
    @Payload() payload: GetUserByEmailRequest,
  ): Promise<GetUserByEmailResponse> {
    return this.userService.getUserByEmail(payload.email);
  }

  @RpcPublic()
  @MessagePattern(USER_MESSAGE_PATTERN.getUserByPhone)
  public async getUserByPhone(
    @Payload() payload: GetUserByPhoneRequest,
  ): Promise<GetUserByPhoneResponse> {
    return this.userService.getUserByPhone(payload.phone);
  }

  @MessagePattern(USER_MESSAGE_PATTERN.updateUser)
  public async updateUser(
    @Payload() payload: UpdateUserRequest,
  ): Promise<UserResponse> {
    return this.userService.updateUser(payload);
  }
}
