import { Logger } from '@nestjs/common';

type RecordKafkaRpcMetricInput = {
  readonly pattern: string;
  readonly timeoutMs: number;
  readonly durationMs: number;
  readonly outcome: 'success' | 'error' | 'timeout';
  readonly errorName?: string;
};

const logger: Logger = new Logger('KafkaRpc');

export function recordKafkaRpcMetric(input: RecordKafkaRpcMetricInput): void {
  logger.log(
    JSON.stringify({
      event: 'kafka_rpc',
      pattern: input.pattern,
      timeoutMs: input.timeoutMs,
      durationMs: input.durationMs,
      outcome: input.outcome,
      ...(input.errorName !== undefined ? { errorName: input.errorName } : {}),
    }),
  );
}
