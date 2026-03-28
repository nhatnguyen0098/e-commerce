import type { EnvironmentVariableKey } from './environment-variable-key.type';

type GetServicePortInput = {
  readonly configKey: Extract<EnvironmentVariableKey, `${string}_PORT`>;
  readonly defaultValue: number;
};

export function getServicePort(input: GetServicePortInput): number {
  const configuredPort: string | undefined = process.env[input.configKey];
  if (!configuredPort) {
    return input.defaultValue;
  }
  const parsedPort: number = Number(configuredPort);
  if (Number.isNaN(parsedPort)) {
    return input.defaultValue;
  }
  return parsedPort;
}
