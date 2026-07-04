import { NotFoundException } from '@nestjs/common';

export class UrlNotFoundException extends NotFoundException {
  constructor(shortCode: string) {
    super({
      code: 'URL_NOT_FOUND',
      message: `código não encontrado: ${shortCode}`,
    });
  }
}
