import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { RPC_PUBLIC_METADATA_KEY } from '../constants/rpc-public-metadata-key.constant';
import { verifyJwt } from '../utils/verify-jwt';

type RpcPayloadWithAccessToken = {
  readonly accessToken?: string;
};

@Injectable()
export class RpcAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Validate JWT token from incoming RPC payload.
   */
  public canActivate(context: ExecutionContext): boolean {
    const isRpcPublic: boolean =
      this.reflector.getAllAndOverride<boolean>(RPC_PUBLIC_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;
    if (isRpcPublic) {
      return true;
    }
    const payload: RpcPayloadWithAccessToken = context.switchToRpc().getData();
    if (!payload.accessToken) {
      throw new RpcException('Unauthorized');
    }
    const verifyResult = verifyJwt({ accessToken: payload.accessToken });
    if (!verifyResult.isValid) {
      throw new RpcException('Unauthorized');
    }
    return true;
  }
}
