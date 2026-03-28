import { KafkaOptions, Transport } from '@nestjs/microservices';
import { getConfig } from './get-config';

type BuildKafkaMicroserviceOptionsInput = {
  readonly clientId: string;
  readonly groupId: string;
};

/**
 * Builds Nest Kafka microservice options from shared environment keys.
 */
export function buildKafkaMicroserviceOptions(
  input: BuildKafkaMicroserviceOptionsInput,
): KafkaOptions {
  const configuredBrokers: string = getConfig({
    configKey: 'KAFKA_BROKERS',
    defaultValue: '127.0.0.1:9092',
  });
  const brokers: string[] = configuredBrokers
    .split(',')
    .map((broker: string) => broker.trim())
    .filter((broker: string) => broker.length > 0);
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: input.clientId,
        brokers,
      },
      producer: {
        // Durable by default for business-critical events/RPC messages.
        allowAutoTopicCreation: false,
        idempotent: true,
        maxInFlightRequests: 5,
      },
      send: {
        // Wait for all in-sync replicas to ack the write.
        acks: -1,
      },
      consumer: {
        groupId: input.groupId,
      },
    },
  };
}
