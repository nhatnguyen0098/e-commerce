import { ClientKafka } from '@nestjs/microservices';

type ConnectKafkaClientWithRetryInput = {
  readonly client: ClientKafka;
  readonly maxAttempts?: number;
  readonly retryDelayMs?: number;
};

/**
 * Connects a Kafka client with retry to handle broker warm-up time.
 */
export async function connectKafkaClientWithRetry(
  input: ConnectKafkaClientWithRetryInput,
): Promise<void> {
  const maxAttempts: number = input.maxAttempts ?? 10;
  const retryDelayMs: number = input.retryDelayMs ?? 1000;
  for (let attempt: number = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await input.client.connect();
      return;
    } catch (error: unknown) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}
