import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';

type MicroserviceClientErrorPayload = {
  readonly status?: string | number;
  readonly message?: string | string[];
};

function readMessage(payload: MicroserviceClientErrorPayload): string {
  const raw: string | string[] | undefined = payload.message;
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw) && raw.every((item) => typeof item === 'string')) {
    return raw.join(', ');
  }
  return 'Request failed';
}

/**
 * Converts Nest TCP client error payloads into HTTP exceptions for the gateway.
 */
export function rethrowAuthMicroserviceError(error: unknown): never {
  if (typeof error !== 'object' || error === null) {
    throw new InternalServerErrorException();
  }
  const payload = error as MicroserviceClientErrorPayload;
  const message: string = readMessage(payload);
  const status: string | number | undefined = payload.status;
  if (typeof status === 'number' && status >= 400 && status < 600) {
    throw new HttpException(message, status);
  }
  if (status === 'error') {
    if (message === 'User already exists') {
      throw new HttpException(message, HttpStatus.CONFLICT);
    }
    if (message === 'Invalid email or password') {
      throw new HttpException(message, HttpStatus.UNAUTHORIZED);
    }
    throw new HttpException(message, HttpStatus.BAD_REQUEST);
  }
  if (error instanceof Error) {
    throw new InternalServerErrorException(error.message);
  }
  throw new InternalServerErrorException();
}
