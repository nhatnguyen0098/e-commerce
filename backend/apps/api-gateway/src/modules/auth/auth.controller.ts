import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import type {
  AuthLoginRequest,
  AuthLogoutResponse,
  AuthRegisterRequest,
  AuthTokenResponse,
  AuthUserResponse,
} from '@contracts/auth/auth.contracts';
import { AuthGatewayService } from '../../integrations/auth-service/auth-gateway.service';
import { clearAccessTokenCookie } from '../../common/utils/clear-access-token-cookie';
import { setAccessTokenCookie } from '../../common/utils/set-access-token-cookie';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authGatewayService: AuthGatewayService) {}

  /**
   * Current user from the httpOnly access-token cookie (JWT claims).
   */
  @Get('me')
  public getCurrentUser(
    @Req() request: AuthenticatedRequest,
  ): AuthUserResponse {
    const user: AuthUserResponse | undefined = request.authUser;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  @Public()
  @Post('register')
  public async registerUser(
    @Body() requestBody: AuthRegisterRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthTokenResponse> {
    const tokenResponse: AuthTokenResponse =
      await this.authGatewayService.registerUser(requestBody);
    setAccessTokenCookie(response, tokenResponse.accessToken);
    return tokenResponse;
  }

  @Public()
  @Post('login')
  public async loginUser(
    @Body() requestBody: AuthLoginRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthTokenResponse> {
    const tokenResponse: AuthTokenResponse =
      await this.authGatewayService.loginUser(requestBody);
    setAccessTokenCookie(response, tokenResponse.accessToken);
    return tokenResponse;
  }

  @Post('logout')
  public async logoutUser(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthLogoutResponse> {
    const accessToken: string | undefined = request.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Missing access token');
    }
    const logoutResponse: AuthLogoutResponse =
      await this.authGatewayService.logoutUser({ accessToken });
    clearAccessTokenCookie(response);
    return logoutResponse;
  }
}
