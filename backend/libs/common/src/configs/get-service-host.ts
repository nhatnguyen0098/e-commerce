import type { EnvironmentVariableKey } from './environment-variable-key.type';

type GetServiceHostInput = {
  readonly configKey: Extract<EnvironmentVariableKey, `${string}_HOST`>;
  readonly defaultValue: string;
};

export function getServiceHost(input: GetServiceHostInput): string {
  const configuredHost: string | undefined = process.env[input.configKey];
  if (configuredHost && configuredHost.trim().length > 0) {
    return configuredHost;
  }
  return input.defaultValue;
}
