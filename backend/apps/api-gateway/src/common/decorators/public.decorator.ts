import { SetMetadata } from '@nestjs/common';
import { PUBLIC_ROUTE_METADATA_KEY } from '../constants/public-route-metadata-key.constant';

export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(PUBLIC_ROUTE_METADATA_KEY, true);
