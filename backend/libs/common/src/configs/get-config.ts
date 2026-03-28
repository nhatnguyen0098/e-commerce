import { config as loadDotenv } from 'dotenv';
import type { EnvironmentVariableKey } from './environment-variable-key.type';

type GetConfigInput = {
  readonly configKey: EnvironmentVariableKey;
  readonly defaultValue?: string;
};

loadDotenv({ quiet: true });

export function getConfig(input: GetConfigInput): string {
  const configuredValue: string | undefined = process.env[input.configKey];
  if (configuredValue && configuredValue.trim().length > 0) {
    return configuredValue;
  }
  if (input.defaultValue !== undefined) {
    return input.defaultValue;
  }
  throw new Error(`Missing required environment variable: ${input.configKey}`);
}
