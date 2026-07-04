import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
}

const DEFAULT_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.buildBody(exception, request.url);

    if (body.statusCode >= 500) {
      // Só 5xx loga stack — 4xx é fluxo esperado de negócio.
      this.logger.error(
        `${request.method} ${request.url} -> ${body.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.debug(
        `${request.method} ${request.url} -> ${body.statusCode} ${body.code}`,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private buildBody(exception: unknown, path: string): ErrorResponseBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const raw = exception.getResponse();
      const details =
        typeof raw === 'string' ? { message: raw } : (raw as Record<string, unknown>);

      // ValidationPipe envia message como array de violações.
      const message = Array.isArray(details.message)
        ? details.message.join('; ')
        : String(details.message ?? exception.message);

      const code =
        typeof details.code === 'string'
          ? details.code
          : (DEFAULT_CODES[statusCode] ??
            (statusCode >= 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR'));

      return { statusCode, code, message, timestamp, path };
    }

    // Exception não mapeada: 500 genérico, sem vazar detalhe interno.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'erro interno inesperado',
      timestamp,
      path,
    };
  }
}
