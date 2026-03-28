import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AUTH_MESSAGE_PATTERN,
  type AuthLoginRequest,
  type AuthLogoutRequest,
  type AuthLogoutResponse,
  type AuthRegisterRequest,
  type AuthTokenResponse,
} from '@contracts/auth/auth.contracts';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Handle register message for new account.
   */
  @MessagePattern(AUTH_MESSAGE_PATTERN.register)
  public async registerUser(
    @Payload() requestBody: AuthRegisterRequest,
  ): Promise<AuthTokenResponse> {
    return this.authService.registerUser(requestBody);
  }

  /**
   * Handle login message for existing account.
   */
  @MessagePattern(AUTH_MESSAGE_PATTERN.login)
  public async loginUser(
    @Payload() requestBody: AuthLoginRequest,
  ): Promise<AuthTokenResponse> {
    return this.authService.loginUser(requestBody);
  }

  /**
   * Handle token logout message.
   */
  @MessagePattern(AUTH_MESSAGE_PATTERN.logout)
  public logoutUser(
    @Payload() requestBody: AuthLogoutRequest,
  ): AuthLogoutResponse {
    return this.authService.logoutUser(requestBody);
  }
}
