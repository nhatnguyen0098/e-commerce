import type { EnvironmentVariableKey } from './environment-variable-key.type';
import { getConfig } from './get-config';

type GetNumberConfigInput = {
  readonly configKey: EnvironmentVariableKey;
  readonly defaultValue?: number;
};

export function getNumberConfig(input: GetNumberConfigInput): number {
  const defaultValueAsString: string | undefined =
    input.defaultValue !== undefined ? `${input.defaultValue}` : undefined;
  const configuredValue: string = getConfig({
    configKey: input.configKey,
    defaultValue: defaultValueAsString,
  });
  const parsedNumber: number = Number(configuredValue);
  if (!Number.isNaN(parsedNumber)) {
    return parsedNumber;
  }
  throw new Error(`Invalid number config for key: ${input.configKey}`);
}
