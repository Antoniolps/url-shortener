import { BadRequestException } from '@nestjs/common';

export class InvalidUrlException extends BadRequestException {
  constructor(longUrl: string) {
    super({
      code: 'INVALID_URL',
      message: `URL inválida: ${longUrl}`,
    });
  }
}
