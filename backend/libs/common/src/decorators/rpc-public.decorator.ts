import { SetMetadata } from '@nestjs/common';
import { RPC_PUBLIC_METADATA_KEY } from '../constants/rpc-public-metadata-key.constant';

export const RpcPublic = (): MethodDecorator & ClassDecorator =>
  SetMetadata(RPC_PUBLIC_METADATA_KEY, true);
