import { BadRequestException } from '@nestjs/common';

export class InvalidShortCodeException extends BadRequestException {
  constructor(shortCode: string) {
    super({
      code: 'INVALID_SHORT_CODE',
      message: `shortCode inválido: ${shortCode}`,
    });
  }
}
