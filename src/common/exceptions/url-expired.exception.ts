import { HttpException, HttpStatus } from '@nestjs/common';

export class UrlExpiredException extends HttpException {
  constructor(shortCode: string) {
    super(
      { code: 'URL_EXPIRED', message: `link expirado: ${shortCode}` },
      HttpStatus.GONE,
    );
  }
}
