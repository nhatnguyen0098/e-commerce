import { RpcException } from '@nestjs/microservices';

type RpcErrorLike = {
  readonly status?: unknown;
  readonly message?: unknown;
};

type RpcErrorRule = {
  readonly when: {
    readonly status?: unknown;
    readonly messageIn?: readonly string[];
  };
  readonly mapTo: {
    readonly status: number;
    readonly messageFromSource?: boolean;
    readonly fallbackMessage: string;
  };
};

type MapRpcErrorByRulesInput = {
  readonly error: unknown;
  readonly rules: readonly RpcErrorRule[];
};

/**
 * Maps unknown RPC errors to a consistent RpcException using declarative rules.
 */
export function mapRpcErrorByRules(
  input: MapRpcErrorByRulesInput,
): RpcException | null {
  if (typeof input.error !== 'object' || input.error === null) {
    return null;
  }
  const payload: RpcErrorLike = input.error as RpcErrorLike;
  const sourceMessage: string =
    typeof payload.message === 'string' ? payload.message : '';
  for (const rule of input.rules) {
    const isStatusMatched: boolean =
      rule.when.status === undefined || payload.status === rule.when.status;
    const isMessageMatched: boolean =
      rule.when.messageIn === undefined ||
      rule.when.messageIn.includes(sourceMessage);
    if (!isStatusMatched || !isMessageMatched) {
      continue;
    }
    const mappedMessage: string =
      rule.mapTo.messageFromSource === true && sourceMessage.length > 0
        ? sourceMessage
        : rule.mapTo.fallbackMessage;
    return new RpcException({
      status: rule.mapTo.status,
      message: mappedMessage,
    });
  }
  return null;
}
