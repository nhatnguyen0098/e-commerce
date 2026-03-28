import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { TimeoutError } from 'rxjs';

/**
 * Maps RxJS {@link TimeoutError} from Kafka RPC (`requestKafkaRpc`) to HTTP 503.
 */
@Catch(TimeoutError)
export class TimeoutErrorFilter implements ExceptionFilter {
  public catch(_exception: TimeoutError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Upstream service did not respond in time',
      error: 'Service Unavailable',
    });
  }
}
