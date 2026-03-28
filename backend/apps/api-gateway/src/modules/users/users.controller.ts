import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { AccessToken } from '../../common/decorators/access-token.decorator';
import type {
  GetUserByIdRequest,
  UpdateUserProfilePayload,
  UpdateUserRequest,
  UserResponse,
} from '@contracts/users/users.contracts';
import { UserGatewayService } from '../../integrations/user-service/user-gateway.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userGatewayService: UserGatewayService) {}

  @Get(':id')
  public async getUserById(
    @Param('id') userId: string,
    @AccessToken() accessToken: string,
  ): Promise<UserResponse> {
    const requestBody: GetUserByIdRequest = {
      userId,
      accessToken,
    };
    return this.userGatewayService.getUserById(requestBody);
  }

  @Patch(':id')
  public async updateUserProfile(
    @Param('id') userId: string,
    @AccessToken() accessToken: string,
    @Body() body: UpdateUserProfilePayload,
  ): Promise<UserResponse> {
    const requestBody: UpdateUserRequest = {
      userId,
      accessToken,
      ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.addresses !== undefined ? { addresses: body.addresses } : {}),
    };
    return this.userGatewayService.updateUser(requestBody);
  }
}
