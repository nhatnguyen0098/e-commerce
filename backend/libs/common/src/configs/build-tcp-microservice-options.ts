import { TcpOptions, Transport } from '@nestjs/microservices';
import type { EnvironmentVariableKey } from './environment-variable-key.type';
import { getServiceHost } from './get-service-host';
import { getServicePort } from './get-service-port';

type BuildTcpMicroserviceOptionsInput = {
  readonly host: {
    readonly configKey: Extract<EnvironmentVariableKey, `${string}_HOST`>;
    readonly defaultValue: string;
  };
  readonly port: {
    readonly configKey: Extract<EnvironmentVariableKey, `${string}_PORT`>;
    readonly defaultValue: number;
  };
};

/**
 * Builds Nest TCP microservice options from host/port environment keys.
 */
export function buildTcpMicroserviceOptions(
  input: BuildTcpMicroserviceOptionsInput,
): TcpOptions {
  return {
    transport: Transport.TCP,
    options: {
      host: getServiceHost(input.host),
      port: getServicePort(input.port),
    },
  };
}
