export type KafkaMessageEnvelope<TPayload> = {
  readonly key: string;
  readonly value: TPayload;
};

export function createKafkaMessageEnvelope<TPayload>(input: {
  readonly key: string;
  readonly value: TPayload;
}): KafkaMessageEnvelope<TPayload> {
  return {
    key: input.key,
    value: input.value,
  };
}

export function unwrapKafkaMessageEnvelope<TPayload>(
  payload: TPayload | KafkaMessageEnvelope<TPayload>,
): TPayload {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'value' in payload &&
    'key' in payload
  ) {
    return payload.value;
  }
  return payload;
}
