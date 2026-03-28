import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { recordKafkaRpcMetric } from '@common/observability/kafka-rpc-observability';

type RequestKafkaRpcInput<TPayload> = {
  readonly client: ClientKafka;
  readonly pattern: string;
  readonly payload: TPayload;
  readonly timeoutMs?: number;
};

const DEFAULT_KAFKA_RPC_TIMEOUT_MS: number = 5000;

export async function requestKafkaRpc<TResponse, TPayload>(
  input: RequestKafkaRpcInput<TPayload>,
): Promise<TResponse> {
  const timeoutMs: number = input.timeoutMs ?? DEFAULT_KAFKA_RPC_TIMEOUT_MS;
  const startedAtMs: number = Date.now();
  try {
    const response: TResponse = await firstValueFrom(
      input.client
        .send<TResponse>(input.pattern, input.payload)
        .pipe(timeout(timeoutMs)),
    );
    recordKafkaRpcMetric({
      pattern: input.pattern,
      timeoutMs,
      durationMs: Date.now() - startedAtMs,
      outcome: 'success',
    });
    return response;
  } catch (error: unknown) {
    const errorName: string =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      typeof (error as { name: unknown }).name === 'string'
        ? (error as { name: string }).name
        : 'UnknownError';
    recordKafkaRpcMetric({
      pattern: input.pattern,
      timeoutMs,
      durationMs: Date.now() - startedAtMs,
      outcome: errorName === 'TimeoutError' ? 'timeout' : 'error',
      errorName,
    });
    throw error;
  }
}
